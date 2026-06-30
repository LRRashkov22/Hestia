import { authFetch } from './auth'

const EVENT_BASE = '/api/events'
const REGISTRATION_BASE = '/api'
const NOTIFICATION_BASE = '/api/notifications'

function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' }
}

async function handleRes(res: Response) {
  if (!res.ok) {
    const text = await res.text()
    const errorMessage = text?.trim() || `Request failed (${res.status} ${res.statusText})`
    throw new Error(errorMessage)
  }
  if (res.status === 204) return null
  return res.json()
}

function withParams(base: string, params: Record<string, string | undefined>) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value)
  })
  return `${base}${search.toString() ? `?${search.toString()}` : ''}`
}

export function getEvents(status?: string, search?: string) {
  return authFetch(withParams(EVENT_BASE, { status, search }), { headers: jsonHeaders() }).then(handleRes)
}

export function getEvent(eventId: string) {
  return authFetch(`${EVENT_BASE}/${eventId}`, { headers: jsonHeaders() }).then(handleRes)
}

export function createEvent(payload: unknown) {
  return authFetch(EVENT_BASE, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(payload) }).then(handleRes)
}

export function updateEvent(eventId: string, payload: unknown) {
  return authFetch(`${EVENT_BASE}/${eventId}`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(payload) }).then(handleRes)
}

export function publishEvent(eventId: string) {
  return authFetch(`${EVENT_BASE}/${eventId}/publish`, { method: 'POST', headers: jsonHeaders() }).then(handleRes)
}

export function cancelEvent(eventId: string) {
  return authFetch(`${EVENT_BASE}/${eventId}/cancel`, { method: 'POST', headers: jsonHeaders() }).then(handleRes)
}

export function getOrganizerDashboardCards() {
  return authFetch(`${EVENT_BASE}/organizer/dashboard/cards`, { headers: jsonHeaders() }).then(handleRes)
}

export function getOrganizerDashboardEvents() {
  return authFetch(`${EVENT_BASE}/organizer/dashboard/events`, { headers: jsonHeaders() }).then(handleRes)
}

export function getOrganizerRegistrations(status = 'Confirmed', search?: string, eventId?: string) {
  return authFetch(
    withParams(`${REGISTRATION_BASE}/organizer`, { status, search, eventId }),
    { headers: jsonHeaders() },
  ).then(handleRes)
}

export function getStudentDashboardCards() {
  return authFetch(`${EVENT_BASE}/student/dashboard/cards`, { headers: jsonHeaders() }).then(handleRes)
}

export function getStudentDashboardUpcomingEvents() {
  return authFetch(`${EVENT_BASE}/student/dashboard/upcoming/events`, { headers: jsonHeaders() }).then(handleRes)
}

export function getStudentAvailableEvents() {
  return authFetch(`${EVENT_BASE}/student/event/preview`, { headers: jsonHeaders() }).then(handleRes)
}

export function getStudentEventDetails(eventId: string) {
  return authFetch(`${EVENT_BASE}/student/events/details/${eventId}`, { headers: jsonHeaders() }).then(handleRes)
}

export function getStudentUpcomingRegistrations() {
  return authFetch(`${REGISTRATION_BASE}/dashboard/upcoming`, { headers: jsonHeaders() }).then(handleRes)
}

export function getMyRegistrations() {
  return authFetch(`${REGISTRATION_BASE}/me`, { headers: jsonHeaders() }).then(handleRes)
}

export function registerForEvent(eventId: string) {
  return authFetch(`${REGISTRATION_BASE}/events/${eventId}/registrations`, {
    method: 'POST',
    headers: jsonHeaders(),
  }).then(handleRes)
}

export function cancelRegistration(eventId: string) {
  return authFetch(`${REGISTRATION_BASE}/events/${eventId}/registrations`, {
    method: 'DELETE',
    headers: jsonHeaders(),
  }).then(handleRes)
}

export function getNotifications() {
  return authFetch(NOTIFICATION_BASE, { headers: jsonHeaders() }).then(handleRes)
}

export function getUnreadNotificationCount() {
  return authFetch(`${NOTIFICATION_BASE}/unread-count`, { headers: jsonHeaders() }).then(handleRes)
}

export function markNotificationRead(notificationId: string) {
  return authFetch(`${NOTIFICATION_BASE}/${notificationId}/read`, { method: 'POST', headers: jsonHeaders() }).then(handleRes)
}

export function markAllNotificationsRead() {
  return authFetch(`${NOTIFICATION_BASE}/read-all`, { method: 'POST', headers: jsonHeaders() }).then(handleRes)
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
  getOrganizerRegistrations,
  getStudentDashboardCards,
  getStudentDashboardUpcomingEvents,
  getStudentAvailableEvents,
  getStudentEventDetails,
  getStudentUpcomingRegistrations,
  getMyRegistrations,
  registerForEvent,
  cancelRegistration,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
}
