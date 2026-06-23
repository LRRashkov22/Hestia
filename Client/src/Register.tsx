import { FormEvent, useState } from 'react'
import { register, login } from './api/auth'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await register(username, email, password)
      setStatus('Account created — logging in...')
      await login(email, password)
      setStatus('Registered and logged in.')
      const rawRole = localStorage.getItem('role') || ''
      let role = rawRole.trim()
      if (role.startsWith('[') && role.endsWith(']')) {
        try { role = JSON.parse(role)[0] ?? role } catch { }
      }
      role = role.replace(/^"|"$/g, '')
      if (role.toLowerCase() === 'organizer') {
        window.location.href = '/events'
      } else {
        window.location.href = '/'
      }
    } catch (err: any) {
      setStatus(err?.message || 'Error')
    }
  }

  return (
    <main className="login-shell">
      <section className="form-panel" aria-labelledby="register-title">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-heading">
            <p className="eyebrow">Create account</p>
            <h2 id="register-title">Register</h2>
          </div>

          <label className="field">
            <span>Username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>

          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label className="field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          <button className="submit-button" type="submit">Create account</button>
          {status && <p className="form-status">{status}</p>}
          <p className="signup-copy">Already have an account? <a href="/">Log in</a></p>
        </form>
      </section>
    </main>
  )
}
