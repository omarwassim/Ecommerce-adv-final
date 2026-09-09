import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import DiscountBanner from '../components/DiscountBanner.jsx'
import { TrashIcon } from '../components/icons.jsx'
import { formatPrice } from '../lib/format.js'
import './CartPage.css'

export default function CartPage() {
  const { lines, updateQty, removeItem, subtotal } = useCart()

  if (lines.length === 0) {
    return (
      <div className="cart page">
        <div className="cart__empty card">
          <h1>Your bag is empty</h1>
          <p>Nothing on the shelf yet. Go find something worth keeping the box for.</p>
          <Link to="/search" className="btn">
            Browse figures
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart page">
      <h1 className="cart__title">Your bag</h1>
      <DiscountBanner />

      <div className="cart__layout">
        <ul className="cart__lines">
          {lines.map((line) => (
            <li key={line.lineId} className="cart__line">
              <Link to={`/product/${line.productId}`} className="cart__line-media">
                <img src={line.image} alt={line.title} />
              </Link>
              <div className="cart__line-body">
                <Link to={`/product/${line.productId}`} className="cart__line-title">
                  {line.title}
                </Link>
                <p className="cart__line-variant">
                  {[line.color, line.size].filter(Boolean).join(' · ') || 'One variant'}
                </p>
                <p className="cart__line-unit">{formatPrice(line.unitPriceSnapshot)} each</p>
              </div>
              <div className="cart__line-qty">
                <label className="visually-hidden" htmlFor={`qty-${line.lineId}`}>
                  Quantity for {line.title}
                </label>
                <select
                  id={`qty-${line.lineId}`}
                  value={line.qty}
                  onChange={(e) => updateQty(line.lineId, Number(e.target.value))}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <button
                  className="cart__line-remove"
                  onClick={() => removeItem(line.lineId)}
                  aria-label={`Remove ${line.title}`}
                >
                  <TrashIcon />
                </button>
              </div>
              <div className="cart__line-total">{formatPrice(line.unitPriceSnapshot * line.qty)}</div>
            </li>
          ))}
        </ul>

        <aside className="cart__summary card">
          <h2>Summary</h2>
          <div className="cart__summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <p className="cart__summary-note">
            Shipping and any checkout discount are calculated at checkout.
          </p>
          <Link to="/checkout" className="btn btn--red btn--block">
            Checkout
          </Link>
          <Link to="/search" className="cart__keep-shopping">
            Keep shopping
          </Link>
        </aside>
      </div>
    </div>
  )
}
