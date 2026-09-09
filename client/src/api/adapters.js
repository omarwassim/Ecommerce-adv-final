// Reconciles the backend ProductDto (id, name, description, price, currency,
// stockQuantity, imageUrl, category) with the richer shape the storefront
// renders. The backend has no colour/size/gallery concept yet, so those are
// synthesised deterministically from the product id so a given product always
// shows the same variants.

const COLOR_SETS = [
  ['Classic', 'Midnight', 'Bone'],
  ['Signal Red', 'Cobalt', 'Ink'],
  ['Sunburst', 'Steel', 'Classic'],
  ['Matte Black', 'Chrome'],
]

const SIZE_SETS = [
  ['4"', '7"', '12"'],
  ['6"', '10"'],
  ['3.75"', '6"', '9"', '12"'],
]

function pick(list, seed) {
  return list[Math.abs(seed) % list.length]
}

export function fromApiProduct(dto) {
  if (!dto) return null
  const id = String(dto.id ?? dto.Id)
  const seed = Number(dto.id ?? dto.Id) || id.length
  return {
    id,
    title: dto.name ?? dto.Name ?? 'Untitled figure',
    description: dto.description ?? dto.Description ?? '',
    price: Number(dto.price ?? dto.Price) || 0,
    currency: dto.currency ?? dto.Currency ?? 'EGP',
    image: dto.imageUrl ?? dto.ImageUrl ?? dto.photoUrl ?? dto.PhotoUrl ?? '',
    category: (dto.category ?? dto.Category ?? 'misc').toLowerCase(),
    stock: Number(dto.stockQuantity ?? dto.StockQuantity ?? dto.quantity ?? dto.Quantity) || 0,
    colors: pick(COLOR_SETS, seed),
    sizes: pick(SIZE_SETS, seed + 1),
    badge: null,
    originalPrice: null,
    displayOrder: Number(dto.displayOrder ?? dto.DisplayOrder) || seed,
    // admin discount windows come from AdminDataContext, but honour them if the
    // API ever starts returning them.
    discountPercentage: Number(dto.discountPercentage ?? dto.DiscountPercentage) || 0,
    discountStartsAt: dto.discountStartsAtUtc ?? dto.DiscountStartsAtUtc ?? null,
    discountEndsAt: dto.discountEndsAtUtc ?? dto.DiscountEndsAtUtc ?? null,
    source: 'api',
  }
}

// Storefront product -> AdminProductDto payload for create/update.
export function toAdminProductDto(form) {
  const price = Number(form.price) || 0
  return {
    id: form.id ? Number(form.id) : 0,
    photoUrl: form.image || form.photoUrl || '',
    name: form.title || form.name || '',
    description: form.description || '',
    price,
    quantity: form.stock === '' || form.stock == null ? 0 : Number(form.stock) || 0,
    discountPercentage: Number(form.discountPercentage) || 0,
    discountStartsAtUtc: form.discountStartsAt || null,
    discountEndsAtUtc: form.discountEndsAt || null,
    displayOrder:
      form.displayOrder === '' || form.displayOrder == null
        ? null
        : Number(form.displayOrder),
  }
}

// Backend OrderDto (Items: [{ productId, productName, unitPrice, quantity, lineTotal }])
// -> the shape OrdersPage / analytics expect.
export function fromApiOrder(dto) {
  if (!dto) return null
  return {
    id: String(dto.id ?? dto.Id),
    status: (dto.status ?? dto.Status ?? 'Pending').toLowerCase(),
    total: Number(dto.total ?? dto.Total) || 0,
    createdAt: dto.createdAtUtc ?? dto.CreatedAtUtc ?? null,
    items: (dto.items ?? dto.Items ?? []).map((it) => ({
      productId: String(it.productId ?? it.ProductId),
      productName: it.productName ?? it.ProductName ?? '',
      unitPriceSnapshot: Number(it.unitPrice ?? it.UnitPrice) || 0,
      qty: Number(it.quantity ?? it.Quantity) || 0,
      lineTotal: Number(it.lineTotal ?? it.LineTotal) || 0,
    })),
  }
}
