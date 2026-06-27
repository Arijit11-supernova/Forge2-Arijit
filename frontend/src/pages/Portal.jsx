import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { StatusBadge, PriorityBadge } from '../components/Badges'

export default function Portal() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.portalTickets()
      .then(data => setTickets(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-slate-400">Loading…</div>

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">My Tickets</h2>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          You haven't submitted any tickets yet.
          <div className="mt-3">
            <Link to="/tickets/new" className="text-brand-600 hover:underline text-sm">Submit a ticket →</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => (
            <Link key={t.id} to={`/tickets/${t.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-brand-300 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-brand-700">{t.subject}</span>
                <div className="flex gap-2">
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>#{t.id} · {t.assignee?.name ? `Assigned to ${t.assignee.name}` : 'Unassigned'}</span>
                <span>{new Date(t.created_at).toLocaleDateString()}</span>
              </div>
              {t.csat_rating && (
                <div className="mt-2 text-xs text-amber-500">
                  Your rating: {'⭐'.repeat(t.csat_rating)} ({t.csat_rating}/5)
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
