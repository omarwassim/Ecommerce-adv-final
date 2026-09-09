import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { PRODUCTS, figureImage } from '../data/catalog.js'
import { getEffectiveDiscount, isWindowActive, resolveProductPricing } from '../lib/pricing.js'
import { useAuth } from './AuthContext.jsx'
import * as adminApi from '../api/admin.js'

const AdminDataContext = createContext(null)

const STORAGE_KEY = 'figures.adminData.v1'

function seed() {
  return {
    products: PRODUCTS.map((p) => ({ ...p })),
    storewideDiscount: null, // { percentage, startsAt, endsAt }
    productDiscounts: {}, // { [productId]: { percentage, startsAt, endsAt } }
    auditLog: [],
  }
}

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw)
    return {
      products: Array.isArray(parsed.products) && parsed.products.length ? parsed.products : seed().products,
      storewideDiscount: parsed.storewideDiscount ?? null,
      productDiscounts: parsed.productDiscounts ?? {},
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
    }
  } catch {
    return seed()
  }
}

let auditSeq = 0
function auditEntry(actor, action, entityType, entityId, summary) {
  auditSeq += 1
  return {
    id: `a${Date.now()}-${auditSeq}`,
    actorId: actor?.id ?? 'system',
    actorName: actor?.name || actor?.email || 'system',
    action,
    entityType,
    entityId: String(entityId ?? ''),
    summary,
    at: new Date().toISOString(),
  }
}

function validateWindow(percentage, startsAt, endsAt) {
  const pct = Number(percentage)
  if (Number.isNaN(pct) || pct < 0 || pct > 100) {
    throw new Error('Percentage must be between 0 and 100.')
  }
  if (!startsAt || !endsAt) {
    throw new Error('Both start and end are required.')
  }
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    throw new Error('End must be after start.')
  }
  return { percentage: pct, startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString() }
}

export function AdminDataProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState(readState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* non-fatal */
    }
  }, [state])

  const pushAudit = useCallback(
    (action, entityType, entityId, summary) =>
      setState((s) => ({
        ...s,
        auditLog: [auditEntry(user, action, entityType, entityId, summary), ...s.auditLog],
      })),
    [user],
  )

  // --- Product CRUD ---------------------------------------------------------
  const createProduct = useCallback(
    (form) => {
      if (!form.title?.trim()) throw new Error('Title is required.')
      if (form.price === '' || form.price == null || Number.isNaN(Number(form.price))) {
        throw new Error('Price is required.')
      }
      const price = Number(form.price)
      setState((s) => {
        const maxOrder = s.products.reduce((m, p) => Math.max(m, Number(p.displayOrder) || 0), 0)
        const id = String(
          Math.max(1000, ...s.products.map((p) => Number(p.id) || 0)) + 1,
        )
        const product = {
          id,
          title: form.title.trim(),
          description: form.description ?? '',
          price,
          currency: 'EGP',
          image: form.image || figureImage((form.category || 'misc').toLowerCase(), s.products.length),
          category: (form.category || 'misc').toLowerCase(),
          stock: form.stock === '' || form.stock == null ? 0 : Number(form.stock) || 0,
          colors: form.colors?.length ? form.colors : ['Classic', 'Midnight', 'Bone'],
          sizes: form.sizes?.length ? form.sizes : ['4"', '7"', '12"'],
          badge: form.badge || null,
          originalPrice:
            form.originalPrice === '' || form.originalPrice == null
              ? null
              : Number(form.originalPrice) || null,
          displayOrder:
            form.displayOrder === '' || form.displayOrder == null
              ? maxOrder + 1
              : Number(form.displayOrder),
          source: 'local',
        }
        return {
          ...s,
          products: [...s.products, product],
          auditLog: [
            auditEntry(user, 'create', 'product', id, `Created "${product.title}"`),
            ...s.auditLog,
          ],
        }
      })
      adminApi.createProduct(form).catch(() => {})
    },
    [user],
  )

  const updateProduct = useCallback(
    (id, form) => {
      if (!form.title?.trim()) throw new Error('Title is required.')
      if (form.price === '' || form.price == null || Number.isNaN(Number(form.price))) {
        throw new Error('Price is required.')
      }
      setState((s) => ({
        ...s,
        products: s.products.map((p) =>
          p.id === String(id)
            ? {
                ...p,
                title: form.title.trim(),
                description: form.description ?? p.description,
                price: Number(form.price),
                image: form.image || p.image,
                category: (form.category || p.category).toLowerCase(),
                stock: form.stock === '' || form.stock == null ? 0 : Number(form.stock) || 0,
                badge: form.badge || null,
                originalPrice:
                  form.originalPrice === '' || form.originalPrice == null
                    ? null
                    : Number(form.originalPrice) || null,
                displayOrder:
                  form.displayOrder === '' || form.displayOrder == null
                    ? p.displayOrder
                    : Number(form.displayOrder),
              }
            : p,
        ),
        auditLog: [
          auditEntry(user, 'update', 'product', id, `Updated "${form.title.trim()}"`),
          ...s.auditLog,
        ],
      }))
      adminApi.updateProduct(id, form).catch(() => {})
    },
    [user],
  )

  const removeProduct = useCallback(
    (id) => {
      setState((s) => {
        const target = s.products.find((p) => p.id === String(id))
        const { [String(id)]: _drop, ...restDiscounts } = s.productDiscounts
        return {
          ...s,
          products: s.products.filter((p) => p.id !== String(id)),
          productDiscounts: restDiscounts,
          auditLog: [
            auditEntry(user, 'delete', 'product', id, `Deleted "${target?.title ?? id}"`),
            ...s.auditLog,
          ],
        }
      })
      adminApi.deleteProduct(id).catch(() => {})
    },
    [user],
  )

  // --- Discounts ----------------------------------------------------------
  const setStorewideDiscount = useCallback(
    ({ percentage, startsAt, endsAt }) => {
      const win = validateWindow(percentage, startsAt, endsAt)
      setState((s) => ({
        ...s,
        storewideDiscount: win,
        auditLog: [
          auditEntry(user, 'set', 'discount', 'storewide', `Storewide ${win.percentage}% off`),
          ...s.auditLog,
        ],
      }))
      const hours = Math.max(1, Math.round((new Date(win.endsAt) - new Date(win.startsAt)) / 3600000))
      adminApi.setStorewideDiscount(win.percentage, hours).catch(() => {})
    },
    [user],
  )

  const clearStorewideDiscount = useCallback(() => {
    setState((s) => ({
      ...s,
      storewideDiscount: null,
      auditLog: [auditEntry(user, 'clear', 'discount', 'storewide', 'Cleared storewide discount'), ...s.auditLog],
    }))
  }, [user])

  const setProductDiscount = useCallback(
    (productId, { percentage, startsAt, endsAt }) => {
      const win = validateWindow(percentage, startsAt, endsAt)
      setState((s) => ({
        ...s,
        productDiscounts: { ...s.productDiscounts, [String(productId)]: win },
        auditLog: [
          auditEntry(user, 'set', 'discount', productId, `${win.percentage}% off product ${productId}`),
          ...s.auditLog,
        ],
      }))
      const hours = Math.max(1, Math.round((new Date(win.endsAt) - new Date(win.startsAt)) / 3600000))
      adminApi.setProductDiscount(productId, win.percentage, hours).catch(() => {})
    },
    [user],
  )

  const clearProductDiscount = useCallback(
    (productId) => {
      setState((s) => {
        const { [String(productId)]: _drop, ...rest } = s.productDiscounts
        return {
          ...s,
          productDiscounts: rest,
          auditLog: [
            auditEntry(user, 'clear', 'discount', productId, `Cleared discount on product ${productId}`),
            ...s.auditLog,
          ],
        }
      })
    },
    [user],
  )

  // --- Derived helpers --------------------------------------------------
  const activeStorewide = useMemo(() => {
    const d = state.storewideDiscount
    return d && isWindowActive(d.startsAt, d.endsAt) ? d : null
  }, [state.storewideDiscount])

  // Merge a product's own discount fields with any admin override window.
  const discountWindowFor = useCallback(
    (product) => {
      if (!product) return null
      const override = state.productDiscounts[String(product.id)]
      if (override) {
        return {
          discountPercentage: override.percentage,
          discountStartsAt: override.startsAt,
          discountEndsAt: override.endsAt,
        }
      }
      if (product.discountPercentage) {
        return {
          discountPercentage: product.discountPercentage,
          discountStartsAt: product.discountStartsAt,
          discountEndsAt: product.discountEndsAt,
        }
      }
      return null
    },
    [state.productDiscounts],
  )

  const resolveDiscount = useCallback(
    (product) => {
      const win = discountWindowFor(product)
      return getEffectiveDiscount(win ? { ...product, ...win } : product, state.storewideDiscount)
    },
    [discountWindowFor, state.storewideDiscount],
  )

  const priceFor = useCallback(
    (product, sizeIndex = 0) => {
      const win = discountWindowFor(product)
      return resolveProductPricing(win ? { ...product, ...win } : product, sizeIndex, state.storewideDiscount)
    },
    [discountWindowFor, state.storewideDiscount],
  )

  const getProduct = useCallback(
    (id) => state.products.find((p) => p.id === String(id)) ?? null,
    [state.products],
  )

  const value = {
    products: state.products,
    storewideDiscount: state.storewideDiscount,
    activeStorewide,
    productDiscounts: state.productDiscounts,
    auditLog: state.auditLog,
    createProduct,
    updateProduct,
    removeProduct,
    setStorewideDiscount,
    clearStorewideDiscount,
    setProductDiscount,
    clearProductDiscount,
    discountWindowFor,
    resolveDiscount,
    priceFor,
    getProduct,
    pushAudit,
  }

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext)
  if (!ctx) throw new Error('useAdminData must be used within AdminDataProvider')
  return ctx
}
