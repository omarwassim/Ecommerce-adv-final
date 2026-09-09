import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { lineId } from '../lib/pricing.js'
import { addCartItem } from '../api/cart.js'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext(null)

const STORAGE_KEY = 'figures.cart'

function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const { isAuthed } = useAuth()
  const [lines, setLines] = useState(readCart)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      /* storage unavailable — non-fatal */
    }
  }, [lines])

  // A cart line is keyed by productId + color + size. Adding the same
  // product+variant again increments qty; a different variant is a new line.
  // Prices are snapshotted at add-time and never recomputed.
  const addItem = useCallback(
    (product, { color, size, qty = 1, unitPrice }) => {
      const id = lineId(product.id, color, size)
      setLines((prev) => {
        const existing = prev.find((l) => l.lineId === id)
        if (existing) {
          return prev.map((l) =>
            l.lineId === id ? { ...l, qty: Math.min(10, l.qty + qty) } : l,
          )
        }
        return [
          ...prev,
          {
            lineId: id,
            productId: product.id,
            title: product.title,
            image: product.image,
            color: color ?? null,
            size: size ?? null,
            qty: Math.min(10, qty),
            unitPriceSnapshot: Math.round(unitPrice ?? product.price ?? 0),
          },
        ]
      })
      // Best-effort sync to the server-side cart (backend has no variant concept).
      if (isAuthed) {
        addCartItem(product.id, qty).catch(() => {})
      }
    },
    [isAuthed],
  )

  const updateQty = useCallback((id, qty) => {
    setLines((prev) =>
      prev.map((l) => (l.lineId === id ? { ...l, qty: Math.max(1, Math.min(10, qty)) } : l)),
    )
  }, [])

  const removeItem = useCallback((id) => {
    setLines((prev) => prev.filter((l) => l.lineId !== id))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  // Push every line to the server-side cart before a checkout that hits the API.
  const syncToServer = useCallback(async () => {
    if (!isAuthed) return
    for (const l of lines) {
      try {
        await addCartItem(l.productId, l.qty)
      } catch {
        /* keep going — the backend cart is best-effort */
      }
    }
  }, [isAuthed, lines])

  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines])
  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.unitPriceSnapshot * l.qty, 0),
    [lines],
  )

  const value = { lines, addItem, updateQty, removeItem, clear, syncToServer, count, subtotal }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
