const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken()
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    throw { status: res.status, message: data?.message || 'Request failed', errors: data?.errors }
  }

  return data
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/login', { method: 'POST', body: { email, password } }),

  register: (payload) =>
    request('/register', { method: 'POST', body: payload }),

  me: () => request('/me'),
  logout: () => request('/logout', { method: 'POST' }),

  // Tickets
  tickets: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/tickets${qs ? '?' + qs : ''}`)
  },

  ticket: (id) => request(`/tickets/${id}`),

  createTicket: (data) =>
    request('/tickets', { method: 'POST', body: data }),

  updateTicket: (id, data) =>
    request(`/tickets/${id}`, { method: 'PUT', body: data }),

  deleteTicket: (id) =>
    request(`/tickets/${id}`, { method: 'DELETE' }),

  bulkUpdateTickets: (ids, action) =>
    request('/tickets/bulk', { method: 'PATCH', body: JSON.stringify({ ids, action }) }),

  exportTicketsCsv: async (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    const token = getToken()
    const url = `${BASE}/api/tickets/export${qs ? '?' + qs : ''}`
    const res = await fetch(url, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
    const blob = await res.blob()
    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = 'tickets.csv'
    a.click()
    URL.revokeObjectURL(downloadUrl)
  },

  // Dashboard
  dashboard: () => request('/dashboard'),

  // Activity
  activity: (ticketId) => request(`/tickets/${ticketId}/activity`),

  // SLA
  sla: (ticketId) => request(`/tickets/${ticketId}/sla`),

  // Notifications
  notifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),

  // CSAT
  submitCsat: (ticketId, rating, comment = '') =>
    request(`/tickets/${ticketId}/csat`, { method: 'POST', body: JSON.stringify({ rating, comment }) }),

  // Merge
  mergeTicket: (sourceId, targetId) =>
    request(`/tickets/${sourceId}/merge`, { method: 'POST', body: JSON.stringify({ target_id: targetId }) }),

  // Canned Responses
  cannedResponses: () => request('/canned-responses'),
  createCannedResponse: (title, body) =>
    request('/canned-responses', { method: 'POST', body: JSON.stringify({ title, body }) }),
  deleteCannedResponse: (id) =>
    request(`/canned-responses/${id}`, { method: 'DELETE' }),

  // Public ticket
  submitPublicTicket: (data) =>
    request('/public/tickets', { method: 'POST', body: JSON.stringify(data) }),

  // Portal (customer's own tickets)
  portalTickets: () => request('/portal/tickets'),

  // Comments
  comments: (ticketId) =>
    request(`/tickets/${ticketId}/comments`),

  createComment: (ticketId, body, isInternal = false) =>
    request(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: { body, is_internal: isInternal },
    }),

  updateComment: (id, body) =>
    request(`/comments/${id}`, { method: 'PUT', body: { body } }),

  deleteComment: (id) =>
    request(`/comments/${id}`, { method: 'DELETE' }),
}
