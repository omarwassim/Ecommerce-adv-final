import { apiFetch, ApiError } from './client.js'
import { fromApiOrder } from './adapters.js'

// POST /api/v1/orders  with header Idempotency-Key  ->  OrderDto
// The backend places the order from the *server-side* cart, so the client must
// have synced its lines via POST /cart/items first.
export async function placeOrder({ idempotencyKey, simulateFailure = false }) {
  try {
    const res = await apiFetch('/orders', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
        ...(simulateFailure ? { 'X-Simulate-Failure': 'order-fail-after-payment' } : {}),
      },
    })
    return { ok: true, order: fromApiOrder(res) }
  } catch (err) {
    // Distinguish the "payment held / compensation" path from a generic error.
    const body = err instanceof ApiError ? err.body : null
    const code =
      (body && (body.code || body.error)) || (err instanceof ApiError ? err.message : '')
    const isCompensation =
      simulateFailure ||
      /compensat|payment.*held|order.*fail/i.test(String(code)) ||
      (err instanceof ApiError && err.status === 409)
    return {
      ok: false,
      compensation: isCompensation,
      code: err instanceof ApiError ? err.code || `HTTP_${err.status}` : 'UNKNOWN',
      error: err instanceof ApiError ? err.message : 'Something went wrong placing your order.',
    }
  }
}

// NOTE: the API has no GET /orders. Order history and admin order stats are
// shown from local placeholder data (src/data/dummy.js) plus any orders this
// browser placed and mirrored to localStorage. There is nothing to fetch.
