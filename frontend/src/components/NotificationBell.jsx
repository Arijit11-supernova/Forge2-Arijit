import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    try {
      const data = await api.notifications()
      setNotifications(data.data || [])
    } catch {}
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClick = async (n) => {
    try {
      await api.markNotificationRead(n.id)
    } catch {}
    setOpen(false)
    if (n.ticket_id) {
      navigate(`/tickets/${n.ticket_id}`)
      setTimeout(fetchNotifications, 500)
    }
  }

  const unread = notifications.length

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-50 max-h-96 overflow-auto">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Notifications</p>
            <p className="text-xs text-slate-400">{unread} unread</p>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">All caught up 🎉</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition flex items-start gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
