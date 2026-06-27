import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', password_confirmation: '',
    organization_name: '', role: 'admin',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register(form)
      navigate('/tickets')
    } catch (err) {
      setError(err.message || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-brand-700">PulseDesk</h1>
          <p className="text-slate-500 mt-2">Create your organization</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 border border-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
            <input required value={form.name} onChange={set('name')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Organization name</label>
            <input required value={form.organization_name} onChange={set('organization_name')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={set('email')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" required value={form.password} onChange={set('password')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
            <input type="password" required value={form.password_confirmation} onChange={set('password_confirmation')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select value={form.role} onChange={set('role')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none">
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50">
            {loading ? 'Creating…' : 'Create account'}
          </button>
          <p className="text-center text-sm text-slate-500">
            Already have an account? <Link to="/login" className="text-brand-600 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
