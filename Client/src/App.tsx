import { type ChangeEvent, type FormEvent, useState } from 'react'
import heroImg from './assets/hero.png'
import './App.css'

type FormState = {
  email: string
  password: string
  remember: boolean
}

function App() {
  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
    remember: true,
  })
  const [status, setStatus] = useState('')

  const updateTextField =
    (field: 'email' | 'password') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }))
      setStatus('')
    }

  const updateRemember = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({
      ...current,
      remember: event.target.checked,
    }))
    setStatus('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.email || !form.password) {
      setStatus('Please enter both your email and password.')
      return
    }

    setStatus('Login details captured on the frontend.')
  }

  return (
    <main className="login-shell">
      <section className="brand-panel" aria-label="Hestia welcome panel">
        <div className="brand-mark">
          <img src={heroImg} width="170" height="179" alt="" />
        </div>
        <p className="eyebrow">Hestia</p>
        <h1>Welcome back</h1>
        <p className="brand-copy">
          Sign in to continue managing your account, saved preferences, and
          workspace access.
        </p>
      </section>

      <section className="form-panel" aria-labelledby="login-title">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-heading">
            <p className="eyebrow">Secure access</p>
            <h2 id="login-title">Log in</h2>
          </div>

          <label className="field">
            <span>Email address</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={updateTextField('email')}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={updateTextField('password')}
            />
          </label>

          <div className="form-row">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={updateRemember}
              />
              <span>Remember me</span>
            </label>
            <a href="/forgot-password">Forgot password?</a>
          </div>

          <button type="submit" className="submit-button">
            Log in
          </button>

          {status && (
            <p className="form-status" role="status">
              {status}
            </p>
          )}

          <p className="signup-copy">
            New to Hestia? <a href="/register">Create an account</a>
          </p>
        </form>
      </section>
    </main>
  )
}

export default App
