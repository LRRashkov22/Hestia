// Use Vite proxy and same-origin routing in development and production.
const BASE = '/api/identity'

type TokenResponse = {
  accessToken?: string
  refreshToken?: string
  AccessToken?: string
  RefreshToken?: string
}

type JwtPayload = Record<string, unknown>

const ROLE_CLAIMS = [
  'role',
  'roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
]

const USER_ID_CLAIMS = [
  'nameid',
  'sub',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier',
]

const NAME_CLAIMS = [
  'name',
  'unique_name',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
]

const EMAIL_CLAIMS = [
  'email',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
]

function getTokenField(data: TokenResponse, field: 'accessToken' | 'refreshToken') {
  return data[field] ?? data[field === 'accessToken' ? 'AccessToken' : 'RefreshToken']
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const payload = token.split('.')[1]
  if (!payload) return null

  try {
    const base64 = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payload.length / 4) * 4, '=')
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

function readClaim(payload: JwtPayload | null, names: string[]) {
  if (!payload) return null

  for (const name of names) {
    const value = payload[name]
    if (Array.isArray(value)) return value[0] == null ? null : String(value[0])
    if (typeof value === 'string') return value.replace(/^"|"$/g, '').trim()
  }

  return null
}

function persistTokens(data: TokenResponse) {
  const accessToken = getTokenField(data, 'accessToken')
  const refreshToken = getTokenField(data, 'refreshToken')

  if (!accessToken || !refreshToken) {
    console.error('auth missing tokens', { accessToken, refreshToken, data })
    throw new Error('Authentication succeeded but did not return valid tokens.')
  }

  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)

  const payload = decodeJwtPayload(accessToken)
  const role = readClaim(payload, ROLE_CLAIMS)
  const userId = readClaim(payload, USER_ID_CLAIMS)
  const name = readClaim(payload, NAME_CLAIMS)
  const email = readClaim(payload, EMAIL_CLAIMS)

  if (role) localStorage.setItem('role', role)
  if (userId) localStorage.setItem('userId', userId)
  if (name) localStorage.setItem('name', name)
  if (email) localStorage.setItem('email', email)
}

export function clearAuth() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('role')
  localStorage.removeItem('userId')
  localStorage.removeItem('name')
  localStorage.removeItem('email')
}

export function getCurrentUser() {
  return {
    name: localStorage.getItem('name') || 'User',
    email: localStorage.getItem('email') || '',
    role: localStorage.getItem('role') || '',
    userId: localStorage.getItem('userId') || '',
  }
}

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken')
  const existingAccessToken = localStorage.getItem('accessToken')
  const userId = localStorage.getItem('userId') || readClaim(decodeJwtPayload(existingAccessToken ?? ''), USER_ID_CLAIMS)

  if (!refreshToken || !userId) {
    clearAuth()
    throw new Error('Your session has expired. Please log in again.')
  }

  const res = await fetch(`${BASE}/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, refreshToken }),
  })

  if (!res.ok) {
    clearAuth()
    const text = await res.text()
    throw new Error(text || 'Your session has expired. Please log in again.')
  }

  const data: TokenResponse = await res.json()
  persistTokens(data)
  return getTokenField(data, 'accessToken')!
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}, retry = true): Promise<Response> {
  const headers = new Headers(init.headers)
  const accessToken = localStorage.getItem('accessToken')

  if (!accessToken) {
    throw new Error('Missing access token for API request.')
  }

  headers.set('Authorization', `Bearer ${accessToken}`)

  const res = await fetch(input, { ...init, headers })
  if (res.status !== 401 || !retry) return res

  const refreshedToken = await refreshAccessToken()
  headers.set('Authorization', `Bearer ${refreshedToken}`)
  return fetch(input, { ...init, headers })
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Login failed')
  }

  const data: TokenResponse = await res.json()
  persistTokens(data)
  return data
}

export async function register(username: string, email: string, password: string) {
  const res = await fetch(`${BASE}/create-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Register failed')
  }
  return true
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const res = await authFetch(`${BASE}/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: currentPassword, currentPassword, oldPassword: currentPassword, newPassword }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Password update failed')
  }

  const data: TokenResponse | null = await res.json().catch(() => null)
  if (data) persistTokens(data)

  return true
}
