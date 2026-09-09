import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import DiscountBanner from '../components/DiscountBanner.jsx'
import { CheckIcon } from '../components/icons.jsx'
import { formatPrice } from '../lib/format.js'
import {
  getBestUserDiscount,
  loadUserDiscountState,
  recordOrderCompleted,
  saveUserDiscountState,
} from '../lib/userDiscount.js'
import { placeOrder } from '../api/orders.js'
import { saveLocalOrder } from '../lib/localOrders.js'
import './CheckoutPage.css'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { lines, subtotal, clear, syncToServer } = useCart()
  const { user } = useAuth()

  const [name, setName] = useState(user?.name || 'Demo Collector')
  const [address, setAddress] = useState('12 Shelf Lane, Cairo')
  const [phone, setPhone] = useState('+20 100 000 0000')
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState(null)
  const [paidSummary, setPaidSummary] = useState(null)

  // Generated once per page visit — re-submits from the same visit are safe to retry.
  const idempotencyKey = useRef(crypto.randomUUID())

  const discount = getBestUserDiscount(loadUserDiscountState(user?.id))
  const discountAmount = discount ? Math.round(subtotal * (discount.percentage / 100)) : 0
  const total = subtotal - discountAmount

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    // Snapshot totals now — the cart is cleared right after a success.
    const snapshot = {
      subtotal,
      discount: discount ? { ...discount, amount: discountAmount } : null,
      total,
      lines: lines.map((l) => ({ ...l })),
    }

    await syncToServer()
    const result = await placeOrder({
      idempotencyKey: idempotencyKey.current,
      simulateFailure,
    })

    if (result.ok) {
      finishSuccess(result.order, snapshot)
      setBusy(false)
      return
    }

    // Offline / API unreachable and not a deliberate failure test — fall back to
    // a locally-simulated order so the flow still completes.
    if (result.code === 'NETWORK' && !simulateFailure) {
      finishSuccess(
        {
          id: `LOCAL-${idempotencyKey.current.slice(0, 8).toUpperCase()}`,
          status: 'confirmed',
          total: snapshot.total,
          createdAt: new Date().toISOString(),
          items: snapshot.lines.map((l) => ({
            productId: l.productId,
            productName: l.title,
            unitPriceSnapshot: l.unitPriceSnapshot,
            qty: l.qty,
            lineTotal: l.unitPriceSnapshot * l.qty,
          })),
          local: true,
        },
        snapshot,
      )
      setBusy(false)
      return
    }

    if (result.compensation) {
      // Payment succeeded but the order failed — show a "payment held" result,
      // not a generic error.
      setOrder({ compensation: true, id: idempotencyKey.current.slice(0, 8).toUpperCase() })
      setPaidSummary(snapshot)
      setBusy(false)
      return
    }

    setError(result.error || 'We could not place your order. Please try again.')
    setBusy(false)
  }

  function finishSuccess(placed, snapshot) {
    setOrder(placed)
    setPaidSummary(snapshot)
    // Advance the per-user checkout discount state.
    const nextState = recordOrderCompleted(loadUserDiscountState(user?.id))
    saveUserDiscountState(user?.id, nextState)
    // Mirror to local order history (no GET /orders on the API yet).
    saveLocalOrder(user?.id, {
      id: String(placed.id),
      status: placed.status || 'confirmed',
      total: snapshot.total,
      createdAt: placed.createdAt || new Date().toISOString(),
      items: snapshot.lines.map((l) => ({
        productId: l.productId,
        productName: l.title,
        unitPriceSnapshot: l.unitPriceSnapshot,
        qty: l.qty,
        lineTotal: l.unitPriceSnapshot * l.qty,
      })),
    })
    clear()
  }

  // --- order-result view ---------------------------------------------------
  if (order) {
    if (order.compensation) {
      return (
        <div className="checkout page">
          <div className="checkout__result card checkout__result--held">
            <h1>Payment held</h1>
            <p>
              Your payment went through, but we hit a snag creating the order (reference{' '}
              <strong>{order.id}</strong>). Nothing else will be charged — our team will either
              complete the order or refund you automatically within 24 hours.
            </p>
            {paidSummary && (
              <p className="checkout__result-total">
                Amount held: <strong>{formatPrice(paidSummary.total)}</strong>
              </p>
            )}
            <div className="checkout__result-actions">
              <Link to="/orders" className="btn">
                View orders
              </Link>
              <Link to="/" className="btn btn--ghost">
                Back to store
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="checkout page">
        <div className="checkout__result card checkout__result--ok">
          <span className="checkout__tick">
            <CheckIcon size={28} />
          </span>
          <h1>Order placed</h1>
          <p>
            Order <strong>{order.id}</strong> is {order.status}
            {order.local ? ' (saved locally — backend was offline)' : ''}. A confirmation is on its
            way.
          </p>
          {paidSummary && (
            <div className="checkout__result-summary">
              <div>
                <span>Subtotal</span>
                <span>{formatPrice(paidSummary.subtotal)}</span>
              </div>
              {paidSummary.discount && (
                <div className="checkout__result-discount">
                  <span>{discountLabel(paidSummary.discount)}</span>
                  <span>−{formatPrice(paidSummary.discount.amount)}</span>
                </div>
              )}
              <div className="checkout__result-grand">
                <span>Paid</span>
                <span>{formatPrice(paidSummary.total)}</span>
              </div>
            </div>
          )}
          <div className="checkout__result-actions">
            <Link to="/orders" className="btn">
              View orders
            </Link>
            <Link to="/" className="btn btn--ghost">
              Keep shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // --- empty-cart view --------------------------------------------------
  if (lines.length === 0) {
    return (
      <div className="checkout page">
        <div className="checkout__empty card">
          <h1>Nothing to check out</h1>
          <p>Your bag is empty.</p>
          <Link to="/search" className="btn">
            Browse figures
          </Link>
        </div>
      </div>
    )
  }

  // --- checkout form + summary ---------------------------------------------
  return (
    <div className="checkout page">
      <h1 className="checkout__title">Checkout</h1>
      <DiscountBanner />

      <div className="checkout__layout">
        <form className="checkout__form card" onSubmit={handleSubmit}>
          <h2>Shipping</h2>
          {error && <p className="inline-error">{error}</p>}

          <div className="field">
            <label htmlFor="co-name">Full name</label>
            <input id="co-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="co-address">Address</label>
            <input
              id="co-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="co-phone">Phone</label>
            <input id="co-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <label className="checkout__sim">
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
            />
            Simulate payment-ok / order-fail (tests the compensation path)
          </label>

          <button type="submit" className="btn btn--red btn--block" disabled={busy}>
            {busy ? 'Placing order…' : `Place order · ${formatPrice(total)}`}
          </button>
        </form>

        <aside className="checkout__summary card">
          <h2>Order summary</h2>
          <ul className="checkout__lines">
            {lines.map((l) => (
              <li key={l.lineId}>
                <span>
                  {l.title}
                  <em>
                    {' '}
                    ×{l.qty}
                    {l.size ? ` · ${l.size}` : ''}
                  </em>
                </span>
                <span>{formatPrice(l.unitPriceSnapshot * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="checkout__summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {discount && (
            <div className="checkout__summary-row checkout__summary-row--discount">
              <span>{discountLabel(discount)}</span>
              <span>−{formatPrice(discountAmount)}</span>
            </div>
          )}
          <div className="checkout__summary-row checkout__summary-row--total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  )
}

function discountLabel(discount) {
  if (discount.source === 'first-order') return `First-order discount (${discount.percentage}%)`
  if (discount.source === 'post-order') return `Returning-collector discount (${discount.percentage}%)`
  return `Discount (${discount.percentage}%)`
}
