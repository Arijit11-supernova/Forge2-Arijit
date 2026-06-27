import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { StatusBadge, PriorityBadge } from '../components/Badges'

function formatAction(action, meta) {
  if (action === 'status_changed') return `Status changed from ${meta.from || '—'} to ${meta.to}`
  if (action === 'assignee_changed') return `Assignee ${meta.to ? 'set' : 'removed'}`
  if (action === 'comment_added') return meta.is_internal ? 'Internal note added' : 'Comment added'
  return action.replace(/_/g, ' ')
}

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isRole } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [activity, setActivity] = useState([])
  const [sla, setSla] = useState(null)
  const [commentBody, setCommentBody] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingStatus, setEditingStatus] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [canned, setCanned] = useState([])
  const [showCsat, setShowCsat] = useState(false)
  const [csatRating, setCsatRating] = useState(0)
  const [csatComment, setCsatComment] = useState('')
  const [showMerge, setShowMerge] = useState(false)
  const [mergeTarget, setMergeTarget] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [t, c, a, s] = await Promise.all([
        api.ticket(id),
        api.comments(id),
        api.activity(id),
        api.sla(id),
      ])
      setTicket(t)
      setComments(c.data || [])
      setActivity(a || [])
      setSla(s)
      // Load canned responses for agents/admins
      if (isRole('admin', 'agent')) {
        try {
          const cr = await api.cannedResponses()
          setCanned(cr.data || [])
        } catch {}
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const refreshTicket = async () => {
    const [t, a] = await Promise.all([api.ticket(id), api.activity(id)])
    setTicket(t)
    setActivity(a || [])
  }

  const handleUpdateStatus = async (newStatus) => {
    try {
      await api.updateTicket(id, { status: newStatus })
      await refreshTicket()
      setEditingStatus(false)
    } catch (err) {
      alert(err.message || 'Failed to update')
    }
  }

  const handleClaim = async () => {
    setClaiming(true)
    try {
      await api.updateTicket(id, { assignee_id: user.id })
      await refreshTicket()
    } catch (err) {
      alert(err.message || 'Failed to claim')
    }
    setClaiming(false)
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentBody.trim()) return
    try {
      const c = await api.createComment(id, commentBody, isInternal)
      setComments([c, ...comments])
      setCommentBody('')
      setIsInternal(false)
      const a = await api.activity(id)
      setActivity(a || [])
    } catch (err) {
      alert(err.message || 'Failed to add comment')
    }
  }

  const handleCsatSubmit = async () => {
    if (!csatRating) return
    try {
      await api.submitCsat(id, csatRating, csatComment)
      await refreshTicket()
      setShowCsat(false)
    } catch (err) {
      alert(err.message || 'Failed to submit CSAT')
    }
  }

  const handleMerge = async () => {
    if (!mergeTarget) return
    if (!confirm(`Merge this ticket into #${mergeTarget}? This cannot be undone.`)) return
    try {
      await api.mergeTicket(id, mergeTarget)
      navigate(`/tickets/${mergeTarget}`)
    } catch (err) {
      alert(err.message || 'Merge failed')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this ticket?')) return
    try {
      await api.deleteTicket(id)
      navigate('/tickets')
    } catch (err) {
      alert(err.message || 'Failed to delete')
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return
    try {
      await api.deleteComment(commentId)
      setComments(comments.filter(c => c.id !== commentId))
    } catch (err) {
      alert(err.message || 'Failed to delete comment')
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Loading…</div>
  if (!ticket) return <div className="p-8 text-center text-slate-400">Ticket not found.</div>

  const canManage = isRole('admin', 'agent')
  const canDelete = isRole('admin')
  const canClaim = canManage && !ticket.assignee_id

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-4">
        <Link to="/tickets" className="text-sm text-slate-500 hover:text-brand-600">← Back to tickets</Link>
      </div>

      {/* Ticket header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800 mb-2">{ticket.subject}</h2>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="text-sm text-slate-400">#{ticket.id}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {canClaim && (
              <button onClick={handleClaim} disabled={claiming}
                className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                {claiming ? 'Claiming…' : 'Claim Ticket'}
              </button>
            )}
            {canManage && (
              <button onClick={() => setShowMerge(!showMerge)}
                className="text-sm text-slate-600 hover:text-slate-800 border border-slate-300 hover:border-slate-400 px-3 py-1.5 rounded-lg transition">
                Merge
              </button>
            )}
            {canDelete && (
              <button onClick={handleDelete}
                className="text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition">
                Delete
              </button>
            )}
          </div>
        </div>

        {/* SLA indicator */}
        {sla?.has_policy && (
          <div className={`rounded-lg p-3 mb-4 text-sm flex items-center gap-4 ${
            sla.response_breached
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {sla.response_breached ? (
              <span><strong>SLA BREACHED</strong> — Response was due {new Date(sla.response_due_at).toLocaleString()}</span>
            ) : (
              <span>Response due in <strong>{Math.floor(sla.response_remaining_minutes / 60)}h {sla.response_remaining_minutes % 60}m</strong> — {new Date(sla.response_due_at).toLocaleString()}</span>
            )}
            {sla.resolution_breached && (
              <span className="ml-4"><strong>Resolution also breached</strong></span>
            )}
          </div>
        )}

        {/* Merge UI */}
        {showMerge && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 flex items-center gap-3">
            <input type="number" value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)}
              placeholder="Target ticket #ID"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm w-40" />
            <button onClick={handleMerge}
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded-lg">
              Merge into #{mergeTarget || '…'}
            </button>
            <button onClick={() => setShowMerge(false)} className="text-sm text-slate-500">Cancel</button>
          </div>
        )}

        {/* CSAT widget */}
        {ticket.csat_rating ? (
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 mb-4 text-sm flex items-center gap-2">
            <span className="font-semibold text-brand-700">CSAT:</span>
            <span className="text-brand-600">{'⭐'.repeat(ticket.csat_rating)}</span>
            <span className="text-slate-400">({ticket.csat_rating}/5)</span>
            {ticket.csat_comment && <span className="text-slate-500 ml-2">— "{ticket.csat_comment}"</span>}
          </div>
        ) : ticket.requester_id === user?.id && (ticket.status === 'resolved' || ticket.status === 'closed') ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            {showCsat ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-800">Rate your experience</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setCsatRating(n)}
                      className={`text-2xl ${csatRating >= n ? 'text-amber-400' : 'text-slate-300'}`}>⭐</button>
                  ))}
                </div>
                <input type="text" value={csatComment} onChange={(e) => setCsatComment(e.target.value)}
                  placeholder="Optional comment…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
                <button onClick={handleCsatSubmit} disabled={!csatRating}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-50">
                  Submit Rating
                </button>
              </div>
            ) : (
              <button onClick={() => setShowCsat(true)}
                className="text-sm text-amber-700 hover:underline">
                Rate your support experience →
              </button>
            )}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4 text-sm mb-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-slate-400">Requester: </span>
            <span className="text-slate-700">{ticket.requester?.name || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400">Assignee: </span>
            <span className="text-slate-700">{ticket.assignee?.name || 'Unassigned'}</span>
          </div>
          <div>
            <span className="text-slate-400">Created: </span>
            <span className="text-slate-700">{new Date(ticket.created_at).toLocaleString()}</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Description</h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {/* Status changer for agents/admins */}
        {canManage && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {editingStatus ? (
              <div className="flex gap-2">
                <select defaultValue={ticket.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button onClick={() => setEditingStatus(false)}
                  className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setEditingStatus(true)}
                className="text-sm text-brand-600 hover:underline">Change status</button>
            )}
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">
          Comments ({comments.length})
        </h3>

        {/* Add comment */}
        <form onSubmit={handleAddComment} className="mb-6 space-y-3">
          {canManage && canned.length > 0 && (
            <select
              onChange={(e) => { if (e.target.value) { setCommentBody(canned.find(c => c.id == e.target.value)?.body || ''); e.target.value = ''; } }}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 bg-slate-50"
            >
              <option value="">Insert canned response…</option>
              {canned.map(cr => (
                <option key={cr.id} value={cr.id}>{cr.title}</option>
              ))}
            </select>
          )}
          <textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            rows={3}
            placeholder="Write a reply…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
          />
          <div className="flex items-center justify-between">
            {canManage && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                Internal note
              </label>
            )}
            <button type="submit"
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition ml-auto">
              Post
            </button>
          </div>
        </form>

        {/* Comment list */}
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className={`rounded-lg p-4 ${c.is_internal ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-brand-200 text-brand-700 flex items-center justify-center text-xs font-semibold">
                    {c.author?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{c.author?.name}</span>
                  {c.is_internal && (
                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">Internal</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                  {(c.author_id === user?.id || canDelete) && (
                    <button onClick={() => handleDeleteComment(c.id)}
                      className="text-xs text-red-500 hover:text-red-700">Delete</button>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No comments yet.</p>
          )}
        </div>
      </div>

      {/* Activity log */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">Activity Log</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No activity yet.</p>
        ) : (
          <div className="space-y-3">
            {activity.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <span className="text-slate-700">{formatAction(log.action, log.meta)}</span>
                  {log.actor && <span className="text-slate-400"> · {log.actor.name}</span>}
                  <span className="text-slate-400"> · {new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
