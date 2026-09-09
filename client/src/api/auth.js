import { apiFetch } from './client.js'

// POST /api/v1/auth/login  ->  { token }
export async function login(email, password) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  })
  return res.token ?? res.Token
}

// POST /api/v1/auth/register  ->  { userId }
export async function register(email, password, fullName) {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    auth: false,
    body: { email, password, fullName },
  })
  return res.userId ?? res.UserId
}

// The API issues a JWT but exposes no /auth/me. Decode the token client-side
// for id / email / role / name so the UI can gate on user.role === 'admin'.
export function decodeToken(token) {
  if (!token) return null
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    )
    const role = (
      payload.role ||
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      'User'
    ).toLowerCase()
    return {
      id: String(
        payload.sub ||
          payload.nameid ||
          payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
          '',
      ),
      email:
        payload.email ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
        '',
      name:
        payload.name ||
        payload.unique_name ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
        '',
      role: role === 'admin' ? 'admin' : 'user',
      exp: payload.exp ? payload.exp * 1000 : null,
    }
  } catch {
    return null
  }
}
