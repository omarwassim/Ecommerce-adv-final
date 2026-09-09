import { apiFetch } from './client.js'

// POST /api/v1/cart/items  { productId, quantity }  ->  CartDto
// The backend cart is keyed by user + productId only (no variant concept), so
// the storefront treats this as a best-effort sync of quantities; the source of
// truth for variant-level lines stays client-side (see CartContext).
export async function addCartItem(productId, quantity) {
  return apiFetch('/cart/items', {
    method: 'POST',
    body: { productId: Number(productId), quantity: Number(quantity) },
  })
}
