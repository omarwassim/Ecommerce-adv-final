// Rolls order line items into per-product totals, then ranks / shares by the
// selected metric ('units' | 'revenue').
export function aggregateSales(orders) {
  const byProduct = new Map()
  orders.forEach((order) => {
    ;(order.items || []).forEach((item) => {
      const cur = byProduct.get(item.productId) ?? {
        productId: item.productId,
        name: item.productName || item.title || `#${item.productId}`,
        units: 0,
        revenue: 0,
      }
      const qty = item.qty ?? item.quantity ?? 0
      const unit = item.unitPriceSnapshot ?? item.unitPrice ?? 0
      cur.units += qty
      cur.revenue += item.lineTotal ?? unit * qty
      byProduct.set(item.productId, cur)
    })
  })
  return [...byProduct.values()]
}

export function rankBy(rows, metric) {
  return [...rows].sort((a, b) => b[metric] - a[metric])
}

export function barWidth(value, maxOfSet) {
  if (!maxOfSet) return 0
  return (value / maxOfSet) * 100
}

export function shareOfTotal(value, total) {
  if (!total) return 0
  return (value / total) * 100
}
