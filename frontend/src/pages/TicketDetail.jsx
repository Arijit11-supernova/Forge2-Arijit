import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { StatusBadge, PriorityBadge } from '../components/Badges'

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isRole } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [commentBody, setCommentBody] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingStatus, setEditingStatus] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const t = await api.ticket(id)
      setTicket(t)
      const c = await api.comments(id)
      setComments(c.data || [])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpdateStatus = async (newStatus) => {
    try {
      const updated = await api.updateTicket(id, { status: newStatus })
      setTicket(updated)
      setEditingStatus(false)
    } catch (err) {
      alert(err.message || 'Failed to update')
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentBody.trim()) return
    try {
      const c = await api.createComment(id, commentBody, isInternal)
      setComments([c, ...comments])
      setCommentBody('')
      setIsInternal(false)
    } catch (err) {
      alert(err.message || 'Failed to add comment')
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
          {canDelete && (
            <button onClick={handleDelete}
              className="text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition">
              Delete
            </button>
          )}
        </div>

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
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">
          Comments ({comments.length})
        </h3>

        {/* Add comment */}
        <form onSubmit={handleAddComment} className="mb-6 space-y-3">
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
    </div>
  )
}
