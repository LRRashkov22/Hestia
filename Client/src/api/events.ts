// Use Vite proxy like auth.ts does
const BASE = '/api/events'

function authHeader() {
  const token = localStorage.getItem('accessToken')
  console.debug('events authHeader token', token ? 'present' : 'missing')
  return token ? { Authorization: `Bearer ${token}` } : {}
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
  return fetch(url, { headers: { 'Content-Type': 'application/json', ...authHeader() } }).then(handleRes)
}

export function getEvent(eventId: string) {
  return fetch(`${BASE}/${eventId}`, { headers: { 'Content-Type': 'application/json', ...authHeader() } }).then(handleRes)
}

export function createEvent(payload: any) {
  return fetch(`${BASE}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(payload) }).then(handleRes)
}

export function updateEvent(eventId: string, payload: any) {
  return fetch(`${BASE}/${eventId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(payload) }).then(handleRes)
}

export function publishEvent(eventId: string) {
  return fetch(`${BASE}/${eventId}/publish`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() } }).then(handleRes)
}

export function cancelEvent(eventId: string) {
  return fetch(`${BASE}/${eventId}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() } }).then(handleRes)
}

// Organizer dashboard
export function getOrganizerDashboardCards() {
  const headers = { ...authHeader() }
  console.debug('getOrganizerDashboardCards', BASE, headers)
  return fetch(`${BASE}/organizer/dashboard/cards`, { headers }).then(handleRes)
}

export function getOrganizerDashboardEvents() {
  const headers = { ...authHeader() }
  console.debug('getOrganizerDashboardEvents', BASE, headers)
  return fetch(`${BASE}/organizer/dashboard/events`, { headers }).then(handleRes)
}

// Student endpoints
export function getStudentDashboardCards() {
  return fetch(`${BASE}/student/dashboard/cards`, { headers: { 'Content-Type': 'application/json', ...authHeader() } }).then(handleRes)
}

export function getStudentDashboardUpcomingEvents() {
  return fetch(`${BASE}/student/dashboard/upcoming/events`, { headers: { 'Content-Type': 'application/json', ...authHeader() } }).then(handleRes)
}

export function getStudentAvailableEvents() {
  return fetch(`${BASE}/student/event/preview`, { headers: { 'Content-Type': 'application/json', ...authHeader() } }).then(handleRes)
}

export function getStudentEventDetails(eventId: string) {
  return fetch(`${BASE}/student/events/details/${eventId}`, { headers: { 'Content-Type': 'application/json', ...authHeader() } }).then(handleRes)
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
