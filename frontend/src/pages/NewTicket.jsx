import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export default function NewTicket() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const ticket = await api.createTicket(form)
      navigate(`/tickets/${ticket.id}`)
    } catch (err) {
      setError(err.message || 'Failed to create ticket')
    }
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">New Ticket</h2>
      <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 border border-red-200">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
          <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
            placeholder="Brief summary of the issue" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea required rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
            placeholder="Describe the issue in detail" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Ticket'}
          </button>
          <button type="button" onClick={() => navigate('/tickets')}
            className="border border-slate-300 text-slate-600 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-slate-50 transition">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
