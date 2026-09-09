import { apiFetch } from './client.js'
import { fromApiProduct } from './adapters.js'

// GET /api/v1/products?page&pageSize&category&search  ->  PagedResult<ProductDto>
export async function fetchProducts({ page = 1, pageSize = 40, category, search, signal } = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (category) params.set('category', category)
  if (search) params.set('search', search)

  const res = await apiFetch(`/products?${params.toString()}`, { auth: false, signal })
  const items = (res.items ?? res.Items ?? []).map(fromApiProduct).filter(Boolean)
  return {
    items,
    meta: {
      page: res.page ?? res.Page ?? page,
      pageSize: res.pageSize ?? res.PageSize ?? pageSize,
      totalCount: res.totalCount ?? res.TotalCount ?? items.length,
      totalPages: res.totalPages ?? res.TotalPages ?? 1,
    },
  }
}

// The API has no GET /products/:id yet — page through the listing and match.
export async function fetchProductById(id, { signal } = {}) {
  const { items } = await fetchProducts({ page: 1, pageSize: 200, signal })
  return items.find((p) => p.id === String(id)) ?? null
}
