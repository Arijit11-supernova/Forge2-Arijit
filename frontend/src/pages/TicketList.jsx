import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { StatusBadge, PriorityBadge } from '../components/Badges'

export default function TicketList() {
  const { isRole } = useAuth()
  const [tickets, setTickets] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '', priority: '', search: '', page: 1,
  })
  const [selected, setSelected] = useState(new Set())
  const [bulkAction, setBulkAction] = useState('')
  const [showBulkBar, setShowBulkBar] = useState(false)

  const fetchTickets = useCallback(async () => {
    try {
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.priority) params.priority = filters.priority
      if (filters.search) params.search = filters.search
      params.page = filters.page
      const data = await api.tickets(params)
      setTickets(data.data || [])
      setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total })
    } catch (err) {
      console.error('Failed to load tickets', err)
    }
    setLoading(false)
  }, [filters])

  // Initial load
  useEffect(() => {
    setLoading(true)
    fetchTickets()
  }, [fetchTickets])

  // Real-time polling every 30s (skip when search input focused or loading)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchTickets()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchTickets])

  // Bulk selection
  const toggleSelect = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
    setShowBulkBar(next.size > 0)
  }

  const toggleSelectAll = () => {
    if (selected.size === tickets.length) {
      setSelected(new Set())
      setShowBulkBar(false)
    } else {
      setSelected(new Set(tickets.map(t => t.id)))
      setShowBulkBar(true)
    }
  }

  const applyBulkAction = async () => {
    if (!bulkAction || selected.size === 0) return
    try {
      await api.bulkUpdateTickets([...selected], bulkAction)
      setSelected(new Set())
      setShowBulkBar(false)
      setBulkAction('')
      fetchTickets()
    } catch (err) {
      alert(err.message || 'Bulk action failed')
    }
  }

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const goToPage = (page) => {
    setFilters(prev => ({ ...prev, page }))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tickets</h2>
          <p className="text-sm text-slate-500">{meta.total} total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => api.exportTicketsCsv(filters)}
            className="border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export CSV
          </button>
          {isRole('admin', 'agent', 'customer') && (
            <Link to="/tickets/new"
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
              New Ticket
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search subject or description…"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
        />
        <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={filters.priority} onChange={(e) => updateFilter('priority', e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

        {/* Bulk action bar */}
        {showBulkBar && (
          <div className="bg-brand-50 border-b border-brand-200 px-4 py-2 flex items-center gap-3">
            <span className="text-sm text-brand-700 font-medium">{selected.size} selected</span>
            <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm">
              <option value="">Choose action…</option>
              <option value="open">Set Open</option>
              <option value="pending">Set Pending</option>
              <option value="resolved">Set Resolved</option>
              <option value="closed">Set Closed</option>
            </select>
            <button onClick={applyBulkAction} disabled={!bulkAction}
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-3 py-1 rounded-lg disabled:opacity-50">
              Apply
            </button>
            <button onClick={() => { setSelected(new Set()); setShowBulkBar(false) }}
              className="text-sm text-slate-500 hover:text-slate-700 ml-auto">
              Clear
            </button>
          </div>
        )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading…</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No tickets found.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={selected.size === tickets.length && tickets.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Subject</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Requester</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Assignee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((t) => (
                <tr key={t.id} className={`hover:bg-slate-50 transition ${selected.has(t.id) ? 'bg-brand-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(t.id)}
                      onChange={() => toggleSelect(t.id)}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/tickets/${t.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{t.requester?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{t.assignee?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <button
              onClick={() => goToPage(meta.current_page - 1)}
              disabled={meta.current_page <= 1}
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-50 hover:bg-slate-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">Page {meta.current_page} of {meta.last_page}</span>
            <button
              onClick={() => goToPage(meta.current_page + 1)}
              disabled={meta.current_page >= meta.last_page}
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-50 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
