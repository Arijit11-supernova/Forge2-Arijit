import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-slate-400">Loading…</div>
  if (!stats) return <div className="p-8 text-center text-slate-400">Failed to load dashboard.</div>

  const statusCards = [
    { label: 'Total Tickets', value: stats.total, color: 'bg-brand-600' },
    { label: 'Open', value: stats.by_status.open, color: 'bg-blue-500' },
    { label: 'Pending', value: stats.by_status.pending, color: 'bg-amber-500' },
    { label: 'Resolved', value: stats.by_status.resolved, color: 'bg-green-500' },
  ]

  const priorityRows = [
    { label: 'Urgent', value: stats.by_priority.urgent, color: 'text-red-600' },
    { label: 'High', value: stats.by_priority.high, color: 'text-orange-600' },
    { label: 'Medium', value: stats.by_priority.medium, color: 'text-blue-600' },
    { label: 'Low', value: stats.by_priority.low, color: 'text-slate-600' },
  ]

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statusCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-2 h-10 rounded-full ${card.color} mb-3`} />
            <p className="text-3xl font-bold text-slate-800">{card.value}</p>
            <p className="text-sm text-slate-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">By Priority</h3>
          <div className="space-y-3">
            {priorityRows.map((row) => {
              const pct = stats.total > 0 ? (row.value / stats.total) * 100 : 0
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={`font-medium ${row.color}`}>{row.label}</span>
                    <span className="text-slate-400">{row.value}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-current opacity-60" style={{ width: `${pct}%`, color: row.color.replace('text-', '') }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link to="/tickets?status=open" className="block bg-slate-50 hover:bg-slate-100 rounded-lg p-3 text-sm text-slate-700 transition">
              View open tickets →
            </Link>
            <Link to="/tickets/new" className="block bg-slate-50 hover:bg-slate-100 rounded-lg p-3 text-sm text-slate-700 transition">
              Create new ticket →
            </Link>
            <Link to="/tickets" className="block bg-slate-50 hover:bg-slate-100 rounded-lg p-3 text-sm text-slate-700 transition">
              Browse all tickets →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
