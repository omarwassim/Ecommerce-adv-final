// Thin fetch wrapper around the .NET Web API. Every page that fetches remote
// data is expected to catch failures and fall back to the local static catalog
// (or an empty list for orders) — see the spec's loading/empty/error rules.

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  'https://localhost:58332/api/v1'

const TOKEN_KEY = 'figures.authToken'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable — non-fatal */
  }
}

export class ApiError extends Error {
  constructor(message, { status, body, code } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    this.code = code
  }
}

export async function apiFetch(path, { method = 'GET', body, headers = {}, auth = true, signal } = {}) {
  const finalHeaders = { Accept: 'application/json', ...headers }
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json'

  const token = auth ? getToken() : null
  if (token) finalHeaders.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    throw new ApiError(err?.message || 'Network request failed', { code: 'NETWORK' })
  }

  const text = await res.text()
  let parsed = null
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }
  }

  if (!res.ok) {
    const message =
      (parsed && (parsed.error || parsed.title || parsed.message)) ||
      `Request failed (${res.status})`
    throw new ApiError(message, { status: res.status, body: parsed })
  }

  return parsed
}

export const apiBaseUrl = BASE_URL
