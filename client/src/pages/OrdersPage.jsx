import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDateTime, formatPrice } from '../lib/format.js'
import { loadLocalOrders } from '../lib/localOrders.js'
import { DUMMY_ORDERS } from '../data/dummy.js'
import './OrdersPage.css'

// The API has no GET /orders. This page shows orders this browser actually
// placed (mirrored to localStorage at checkout) followed by demo placeholder
// orders so the list is never empty.
export default function OrdersPage() {
  const { user, isAdmin } = useAuth()

  const orders = useMemo(() => {
    const mine = loadLocalOrders(user?.id)
    const seen = new Set(mine.map((o) => o.id))
    return [...mine, ...DUMMY_ORDERS.filter((o) => !seen.has(o.id))]
  }, [user?.id])

  const heading = isAdmin ? 'All orders' : 'Your orders'

  return (
    <div className="orders page">
      <h1 className="orders__title">{heading}</h1>
      <p className="orders__demo-note">
        Order history is demo data — the API has no <code>GET /orders</code> endpoint. Orders you
        place in this browser are shown for real above the placeholders.
      </p>

      {orders.length === 0 ? (
        <div className="orders__state card">
          <h3>No orders yet</h3>
          <p>When you place an order it shows up here.</p>
          <Link to="/search" className="btn">
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="orders__list">
          {orders.map((o) => (
            <li key={o.id} className="orders__row card">
              <div className="orders__row-main">
                <span className="orders__id">Order {o.id}</span>
                <span className={`orders__status orders__status--${(o.status || '').toLowerCase()}`}>
                  {o.status}
                </span>
              </div>
              <div className="orders__row-meta">
                <span>{formatDateTime(o.createdAt)}</span>
                <span className="orders__total">{formatPrice(o.total)}</span>
              </div>
              {o.items?.length > 0 && (
                <p className="orders__items">
                  {o.items.map((it) => `${it.productName} ×${it.qty}`).join(', ')}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
