// The API has no GET /orders yet, so successful checkouts are also mirrored to
// localStorage per user id — this is the only order history the storefront can
// show until that endpoint exists.

const KEY_PREFIX = 'figures.orders.'

export function loadLocalOrders(userId) {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + (userId || 'guest'))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLocalOrder(userId, order) {
  try {
    const key = KEY_PREFIX + (userId || 'guest')
    const existing = loadLocalOrders(userId)
    localStorage.setItem(key, JSON.stringify([order, ...existing].slice(0, 50)))
  } catch {
    /* storage unavailable — non-fatal */
  }
}
