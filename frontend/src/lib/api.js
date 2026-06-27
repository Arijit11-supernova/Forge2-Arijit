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
