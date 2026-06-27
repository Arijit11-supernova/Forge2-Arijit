import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/tickets')
    } catch (err) {
      setError(err.message || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-700">PulseDesk</h1>
          <p className="text-slate-500 mt-2">Sign in to your support desk</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 border border-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-center text-sm text-slate-500">
            No account? <Link to="/register" className="text-brand-600 hover:underline">Create one</Link>
          </p>
        </form>
        <div className="mt-4 text-center text-xs text-slate-400">
          Demo: admin@acme.test / password
        </div>
      </div>
    </div>
  )
}
