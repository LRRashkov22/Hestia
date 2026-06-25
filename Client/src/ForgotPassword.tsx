import type { FormEvent } from 'react'
import { useState } from 'react'
import { forgotPassword, resetPassword } from './api/auth'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [step, setStep] = useState(0)
  const [token, setToken] = useState('')
  const [userId, setUserId] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const sendEmail = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const resp: any = await forgotPassword(email)
      // resp may contain token (demo only)
      setStatus('Reset token received (demo). Enter new password below.')
      if (resp?.token) setToken(resp.token)
      if (resp?.userId) setUserId(resp.userId)
      setStep(1)
    } catch (err: any) {
      setStatus(err?.message || 'Error')
    }
  }

  const doReset = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await resetPassword(userId || '', token, newPassword)
      setStatus('Password reset successful — you can now log in.')
      setStep(2)
    } catch (err: any) {
      setStatus(err?.message || 'Error')
    }
  }

  return (
    <main className="login-shell">
      <section className="form-panel">
        {step === 0 && (
          <form className="login-form" onSubmit={sendEmail}>
            <h2>Forgot password</h2>
            <label className="field">
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <button className="submit-button" type="submit">Send reset token</button>
            {status && <p className="form-status">{status}</p>}
            <p className="signup-copy"><a href="/">Back to login</a></p>
          </form>
        )}

        {step === 1 && (
          <form className="login-form" onSubmit={doReset}>
            <h2>Enter reset token</h2>
            <label className="field">
              <span>Token</span>
              <input value={token} onChange={(e) => setToken(e.target.value)} />
            </label>
            <label className="field">
              <span>New password</span>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </label>
            <button className="submit-button" type="submit">Reset password</button>
            {status && <p className="form-status">{status}</p>}
          </form>
        )}

        {step === 2 && (
          <div className="login-form">
            <h2>Done</h2>
            <p>{status}</p>
            <p className="signup-copy"><a href="/">Return to login</a></p>
          </div>
        )}
      </section>
    </main>
  )
}
