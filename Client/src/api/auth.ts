// In dev use the Vite dev-server proxy by calling relative `/api/...`
// In production, use the configured VITE_API_BASE_URL.
const rawBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5024/'
const normalizedBase = rawBase.endsWith('/') ? rawBase : rawBase + '/'
const PROD_BASE = `${normalizedBase}api/identity`
// Use the configured API base URL directly (no dev proxy)
const BASE = PROD_BASE

type TokenResponse = { AccessToken: string; RefreshToken: string }

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
  const data = (await res.json()) as TokenResponse
  localStorage.setItem('accessToken', data.AccessToken)
  localStorage.setItem('refreshToken', data.RefreshToken)
  // try to decode role from JWT and store it
  try {
    let b = data.AccessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    while (b.length % 4) b += '='
    const payload = JSON.parse(decodeURIComponent(escape(atob(b))))
    let role: any = payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.roles || payload['roles']
    // handle role as array or JSON string
    if (Array.isArray(role)) role = role[0]
    if (typeof role === 'string') {
      // strip quotes/wrapping
      role = role.replace(/^"|"$/g, '').trim()
    }
    if (role) localStorage.setItem('role', String(role))
  } catch {
    // ignore parse errors
  }
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

export async function forgotPassword(email: string) {
  const res = await fetch(`${BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Forgot password failed')
  }
  return res.json()
}

export async function resetPassword(userId: string, token: string, newPassword: string) {
  const res = await fetch(`${BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, token, newPassword }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Reset password failed')
  }
  return true
}
