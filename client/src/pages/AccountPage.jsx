import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { DEMO_CREDENTIALS } from '../data/catalog.js'
import './AccountPage.css'

export default function AccountPage() {
  const { user, isAuthed, isAdmin, signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState(DEMO_CREDENTIALS.email)
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email, password)
      navigate(location.state?.from || '/checkout', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  if (isAuthed) {
    return (
      <div className="account page">
        <div className="account__panel card">
          <span className="eyebrow">Signed in</span>
          <h1>{user.name || user.email || 'Your account'}</h1>
          <dl className="account__meta">
            {user.email && (
              <>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </>
            )}
            <dt>Role</dt>
            <dd>{isAdmin ? 'Admin' : 'Collector'}</dd>
          </dl>

          <div className="account__links">
            <Link to="/orders" className="btn btn--ghost">
              Your orders
            </Link>
            {isAdmin && (
              <Link to="/admin" className="btn btn--ghost">
                Admin suite
              </Link>
            )}
          </div>

          <button className="btn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="account page">
      <div className="account__form card">
        <span className="eyebrow">Account</span>
        <h1>Sign in</h1>
        <p className="account__hint">
          Demo: <code>{DEMO_CREDENTIALS.email}</code> / <code>{DEMO_CREDENTIALS.password}</code>.
          Admin demo: <code>admin@figures.shop</code> / <code>admin123</code>.
        </p>

        {error && <p className="inline-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="ac-email">Email</label>
            <input
              id="ac-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="ac-password">Password</label>
            <input
              id="ac-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn--red btn--block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
