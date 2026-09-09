// Per-user checkout discount — a separate mechanism from the admin discount,
// stacks independently. It discounts the cart *subtotal at checkout*, not the
// per-product display price.
//
// - A signed-in user with zero completed orders gets 15% off automatically.
// - After their first completed order, they get a 72-hour 15%-off window
//   starting at order completion.
// - Only one state applies at a time; an unused first-order discount takes
//   priority over a post-order window.
// State is keyed by user id and persists across sessions (localStorage), not
// tied to server data.

export const POST_ORDER_PERCENTAGE = 15
export const POST_ORDER_WINDOW_MS = 72 * 60 * 60 * 1000

const KEY_PREFIX = 'figures.userDiscount.'

export function defaultDiscountState() {
  return { ordersCompleted: 0, postOrderWindow: null }
}

export function loadUserDiscountState(userId) {
  if (!userId) return defaultDiscountState()
  try {
    const raw = localStorage.getItem(KEY_PREFIX + userId)
    if (!raw) return defaultDiscountState()
    const parsed = JSON.parse(raw)
    return {
      ordersCompleted: Number(parsed.ordersCompleted) || 0,
      postOrderWindow: parsed.postOrderWindow ?? null,
    }
  } catch {
    return defaultDiscountState()
  }
}

export function saveUserDiscountState(userId, state) {
  if (!userId) return
  try {
    localStorage.setItem(KEY_PREFIX + userId, JSON.stringify(state))
  } catch {
    /* storage unavailable — non-fatal */
  }
}

export function getBestUserDiscount(state) {
  if (state.ordersCompleted === 0) {
    return { percentage: 15, source: 'first-order' }
  }
  if (state.postOrderWindow && Date.now() < state.postOrderWindow.expiresAt) {
    return {
      percentage: state.postOrderWindow.percentage,
      source: 'post-order',
      expiresAt: state.postOrderWindow.expiresAt,
    }
  }
  return null
}

// Call once an order is placed successfully.
export function recordOrderCompleted(state) {
  return {
    ordersCompleted: state.ordersCompleted + 1,
    postOrderWindow: {
      percentage: POST_ORDER_PERCENTAGE,
      expiresAt: Date.now() + POST_ORDER_WINDOW_MS,
    },
  }
}
