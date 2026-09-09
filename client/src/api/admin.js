import { apiFetch } from './client.js'
import { toAdminProductDto } from './adapters.js'

// POST /api/v1/admin/products
export function createProduct(form) {
  return apiFetch('/admin/products', { method: 'POST', body: toAdminProductDto(form) })
}

// PUT /api/v1/admin/products/:id
export function updateProduct(id, form) {
  return apiFetch(`/admin/products/${id}`, { method: 'PUT', body: toAdminProductDto(form) })
}

// DELETE /api/v1/admin/products/:id
export function deleteProduct(id) {
  return apiFetch(`/admin/products/${id}`, { method: 'DELETE' })
}

// POST /api/v1/admin/discounts/product   { productId, discountPercentage, durationHours }
export function setProductDiscount(productId, discountPercentage, durationHours) {
  return apiFetch('/admin/discounts/product', {
    method: 'POST',
    body: {
      productId: Number(productId),
      discountPercentage: Number(discountPercentage),
      durationHours: Number(durationHours),
    },
  })
}

// POST /api/v1/admin/discounts/storewide  { discountPercentage, durationHours }
export function setStorewideDiscount(discountPercentage, durationHours) {
  return apiFetch('/admin/discounts/storewide', {
    method: 'POST',
    body: {
      discountPercentage: Number(discountPercentage),
      durationHours: Number(durationHours),
    },
  })
}

// GET /api/v1/admin/analytics/sales?topN  ->  SalesAnalyticsDto
export async function fetchSalesAnalytics(topN) {
  const q = topN ? `?topN=${topN}` : ''
  const res = await apiFetch(`/admin/analytics/sales${q}`)
  return (res.items ?? res.Items ?? []).map((it) => ({
    productId: String(it.productId ?? it.ProductId),
    name: it.productName ?? it.ProductName ?? '',
    units: Number(it.unitsSold ?? it.UnitsSold) || 0,
    revenue: Number(it.revenueGenerated ?? it.RevenueGenerated) || 0,
    sharePct: Number(it.salesDistributionPercentage ?? it.SalesDistributionPercentage) || 0,
  }))
}

// GET /api/v1/admin/audit-log?page&pageSize
export async function fetchAuditLog({ page = 1, pageSize = 10 } = {}) {
  const res = await apiFetch(`/admin/audit-log?page=${page}&pageSize=${pageSize}`)
  const list = res.items ?? res.Items ?? (Array.isArray(res) ? res : [])
  return {
    entries: list.map((e) => ({
      id: String(e.id ?? e.Id),
      actorId: String(e.adminUserId ?? e.AdminUserId ?? ''),
      action: e.action ?? e.Action ?? '',
      entityType: e.entityType ?? e.EntityType ?? '',
      entityId: String(e.entityId ?? e.EntityId ?? ''),
      summary: e.details ?? e.Details ?? '',
      at: e.createdAtUtc ?? e.CreatedAtUtc ?? null,
    })),
    totalCount: res.totalCount ?? res.TotalCount ?? list.length,
    page: res.page ?? res.Page ?? page,
    pageSize: res.pageSize ?? res.PageSize ?? pageSize,
  }
}
