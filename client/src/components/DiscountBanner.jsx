import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getBestUserDiscount, loadUserDiscountState } from '../lib/userDiscount.js'
import { formatCountdown } from '../lib/format.js'
import './DiscountBanner.css'

export default function DiscountBanner() {
  const { user, isAuthed } = useAuth()
  // Re-render tick every 60s to keep the "expires in Xh Ym" countdown fresh.
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!isAuthed) {
    return (
      <div className="discount-banner discount-banner--guest">
        <span>
          <strong>Sign in for 15% off</strong> your first order — automatically applied at checkout.
        </span>
        <Link to="/account" className="discount-banner__cta">
          Sign in
        </Link>
      </div>
    )
  }

  const discount = getBestUserDiscount(loadUserDiscountState(user?.id))
  if (!discount) return null

  if (discount.source === 'first-order') {
    return (
      <div className="discount-banner discount-banner--first">
        <strong>15% off your first order</strong> is waiting — applied to your subtotal at checkout.
      </div>
    )
  }

  if (discount.source === 'post-order') {
    return (
      <div className="discount-banner discount-banner--window">
        <strong>Welcome back — 15% off.</strong> Your returning-collector discount expires in{' '}
        {formatCountdown(discount.expiresAt)}.
      </div>
    )
  }

  return null
}
