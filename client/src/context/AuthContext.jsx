import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getToken, setToken } from '../api/client.js'
import { decodeToken, login as apiLogin } from '../api/auth.js'
import { DEMO_CREDENTIALS } from '../data/catalog.js'

const AuthContext = createContext(null)

const LOCAL_USER_KEY = 'figures.localUser'

// Offline / no-backend demo accounts. Used only when the API is unreachable.
const DEMO_ACCOUNTS = [
  { ...DEMO_CREDENTIALS, user: { id: 'demo-user', email: DEMO_CREDENTIALS.email, name: 'Demo Collector', role: 'user' } },
  { email: 'admin@figures.shop', password: 'admin123', user: { id: 'demo-admin', email: 'admin@figures.shop', name: 'Store Admin', role: 'admin' } },
]

function readLocalUser() {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function initialUser() {
  const token = getToken()
  if (token) {
    const decoded = decodeToken(token)
    if (decoded && (!decoded.exp || decoded.exp > Date.now())) return decoded
    setToken(null)
  }
  return readLocalUser()
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initialUser)
  const [token, setTokenState] = useState(() => getToken())

  useEffect(() => {
    if (!token) return
    const decoded = decodeToken(token)
    if (decoded?.exp && decoded.exp <= Date.now()) {
      setToken(null)
      setTokenState(null)
      setUser(null)
    }
  }, [token])

  const signIn = useCallback(async (email, password) => {
    const trimmed = email.trim().toLowerCase()
    try {
      const jwt = await apiLogin(trimmed, password)
      if (!jwt) throw new Error('No token returned')
      setToken(jwt)
      setTokenState(jwt)
      const decoded = decodeToken(jwt) ?? { id: '', email: trimmed, name: '', role: 'user' }
      setUser(decoded)
      try {
        localStorage.removeItem(LOCAL_USER_KEY)
      } catch {
        /* ignore */
      }
      return decoded
    } catch (err) {
      // API rejected the credentials outright — surface that, don't fall back.
      if (err?.status === 401) {
        throw new Error('Invalid email or password.')
      }
      // API unreachable — allow the offline demo accounts through.
      const match = DEMO_ACCOUNTS.find(
        (a) => a.email === trimmed && a.password === password,
      )
      if (match) {
        setToken(null)
        setTokenState(null)
        setUser(match.user)
        try {
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(match.user))
        } catch {
          /* ignore */
        }
        return match.user
      }
      throw new Error('Invalid email or password.')
    }
  }, [])

  const signOut = useCallback(() => {
    setToken(null)
    setTokenState(null)
    setUser(null)
    try {
      localStorage.removeItem(LOCAL_USER_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const value = {
    user,
    token,
    isAuthed: !!user,
    isAdmin: user?.role === 'admin',
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
