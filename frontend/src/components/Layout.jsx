import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Layout({ children }) {
  const { user, logout, isRole } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
    }`

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200">
          <h1 className="text-xl font-bold text-brand-700">PulseDesk</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/tickets" className={linkClass}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Tickets
          </NavLink>
          {(isRole('admin', 'agent')) && (
            <NavLink to="/tickets/new" className={linkClass}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Ticket
            </NavLink>
          )}
        </nav>
        <div className="p-3 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-brand-200 text-brand-700 flex items-center justify-center text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
