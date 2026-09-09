// --- Size surcharge -------------------------------------------------------
// Each step above the base size costs ~12% of the *base* price more, rounded
// to the nearest 10. The base (first/smallest) size has no surcharge.
export const SIZE_STEP_RATE = 0.12

export function getSizeSurcharge(basePrice, sizeIndex) {
  if (!sizeIndex || sizeIndex <= 0) return 0
  return Math.round((basePrice * SIZE_STEP_RATE * sizeIndex) / 10) * 10
}

// --- Cart line identity -------------------------------------------------------
// Composite key so the same product in two different variants is two lines.
export function lineId(productId, color, size) {
  return [productId, color || '', size || ''].join('::')
}

// --- Effective admin discount resolution ------------------------------------
// Per-product window beats storewide window; both must be currently active by
// wall-clock time. "Active" means now is within [startsAt, endsAt).
export function isWindowActive(startsAt, endsAt) {
  if (!startsAt || !endsAt) return false
  const now = Date.now()
  return now >= new Date(startsAt).getTime() && now <= new Date(endsAt).getTime()
}

export function getEffectiveDiscount(product, storewideDiscount) {
  if (
    product?.discountPercentage &&
    isWindowActive(product.discountStartsAt, product.discountEndsAt)
  ) {
    return { percentage: product.discountPercentage, source: 'product' }
  }
  if (
    storewideDiscount &&
    isWindowActive(storewideDiscount.startsAt, storewideDiscount.endsAt)
  ) {
    return { percentage: storewideDiscount.percentage, source: 'storewide' }
  }
  return null
}

// Price with size surcharge already applied, times (1 - pct/100), rounded to
// the nearest whole currency unit.
export function applyDiscount(price, percentage) {
  if (!percentage) return Math.round(price)
  return Math.round(price * (1 - percentage / 100))
}

// Convenience: resolve the displayed price for a product at a given size,
// factoring in surcharge + any active admin discount.
export function resolveProductPricing(product, sizeIndex, storewideDiscount) {
  const base = Number(product.price) || 0
  const surcharge = getSizeSurcharge(base, sizeIndex)
  const withSurcharge = base + surcharge
  const discount = getEffectiveDiscount(product, storewideDiscount)
  const current = discount
    ? applyDiscount(withSurcharge, discount.percentage)
    : Math.round(withSurcharge)
  return {
    base,
    surcharge,
    original: Math.round(withSurcharge),
    current,
    discount,
    isDiscounted: !!discount && current < Math.round(withSurcharge),
  }
}
