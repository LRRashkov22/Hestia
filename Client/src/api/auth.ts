// Use Vite proxy and same‑origin routing in development and production.
const BASE = '/api/identity'

type TokenResponse = {
  AccessToken?: string
  RefreshToken?: string
  accessToken?: string
  refreshToken?: string
}

export async function login(email: string, password: string) {
  const url = `${BASE}/login`
  console.debug('login fetch', { url, email })
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  console.debug('login response status', res.status, res.ok)
  
  if (!res.ok) {
    const text = await res.text()
    console.error('login not ok', res.status, text)
    throw new Error(text || 'Login failed')
  }
  
  const text = await res.text()
  console.debug('login response text', text)
  
  let data: TokenResponse
  try {
    data = JSON.parse(text)
  } catch (e) {
    console.error('login json parse error', e, text)
    throw new Error('Login response is not valid JSON')
  }
  
  console.debug('login response data', data)
  const accessToken = data.AccessToken ?? data.accessToken
  const refreshToken = data.RefreshToken ?? data.refreshToken

  console.debug('extracted tokens', { accessToken: !!accessToken, refreshToken: !!refreshToken })

  if (!accessToken || !refreshToken) {
    console.error('login missing tokens', { accessToken, refreshToken, data })
    throw new Error('Login succeeded but did not return valid tokens.')
  }

  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
  console.debug('token saved', {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  })
  // try to decode role from JWT and store it
  try {
    let b = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
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
