// Use environment variable for API base URL with fallback
const rawBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5024/'
const normalizedBase = rawBase.endsWith('/') ? rawBase : rawBase + '/'
const BASE = `${normalizedBase}api/events`

function authHeader(): HeadersInit {
  const token = localStorage.getItem('accessToken')
  console.debug('events authHeader token', token ? 'present' : 'missing')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json', ...authHeader() }
}

async function handleRes(res: Response) {
  if (!res.ok) {
    const text = await res.text()
    console.error('events request failed', res.status, text)
    throw new Error(text || 'Request failed')
  }
  if (res.status === 204) return null
  return res.json()
}

export function getEvents(status?: string, search?: string) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  const url = `${BASE}${params.toString() ? `?${params.toString()}` : ''}`
  return fetch(url, { headers: jsonHeaders() }).then(handleRes)
}

export function getEvent(eventId: string) {
  return fetch(`${BASE}/${eventId}`, { headers: jsonHeaders() }).then(handleRes)
}

export function createEvent(payload: any) {
  return fetch(`${BASE}`, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(payload) }).then(handleRes)
}

export function updateEvent(eventId: string, payload: any) {
  return fetch(`${BASE}/${eventId}`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(payload) }).then(handleRes)
}

export function publishEvent(eventId: string) {
  return fetch(`${BASE}/${eventId}/publish`, { method: 'POST', headers: jsonHeaders() }).then(handleRes)
}

export function cancelEvent(eventId: string) {
  return fetch(`${BASE}/${eventId}/cancel`, { method: 'POST', headers: jsonHeaders() }).then(handleRes)
}

// Organizer dashboard
export function getOrganizerDashboardCards() {
  return fetch(`${BASE}/organizer/dashboard/cards`, { headers: jsonHeaders() }).then(handleRes)
}

export function getOrganizerDashboardEvents() {
  return fetch(`${BASE}/organizer/dashboard/events`, { headers: jsonHeaders() }).then(handleRes)
}

// Student endpoints
export function getStudentDashboardCards() {
  return fetch(`${BASE}/student/dashboard/cards`, { headers: jsonHeaders() }).then(handleRes)
}

export function getStudentDashboardUpcomingEvents() {
  return fetch(`${BASE}/student/dashboard/upcoming/events`, { headers: jsonHeaders() }).then(handleRes)
}

export function getStudentAvailableEvents() {
  return fetch(`${BASE}/student/event/preview`, { headers: jsonHeaders() }).then(handleRes)
}

export function getStudentEventDetails(eventId: string) {
  return fetch(`${BASE}/student/events/details/${eventId}`, { headers: jsonHeaders() }).then(handleRes)
}

export default {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  publishEvent,
  cancelEvent,
  getOrganizerDashboardCards,
  getOrganizerDashboardEvents,
  getStudentDashboardCards,
  getStudentDashboardUpcomingEvents,
  getStudentAvailableEvents,
  getStudentEventDetails,
}
