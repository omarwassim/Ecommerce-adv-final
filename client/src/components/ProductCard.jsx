import { Link } from 'react-router-dom'
import { useAdminData } from '../context/AdminDataContext.jsx'
import { formatPrice } from '../lib/format.js'
import './ProductCard.css'

export default function ProductCard({ product }) {
  const { priceFor } = useAdminData()
  const pricing = priceFor(product, 0)

  const showBadge =
    pricing.isDiscounted
      ? { text: `-${Math.round(pricing.discount.percentage)}%`, kind: 'sale' }
      : product.badge === 'sale'
        ? { text: 'Sale', kind: 'sale' }
        : product.badge === 'top'
          ? { text: 'Top', kind: 'top' }
          : null

  const original = pricing.isDiscounted
    ? pricing.original
    : product.originalPrice && product.originalPrice > pricing.current
      ? product.originalPrice
      : null

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-card__media">
        <img src={product.image} alt={product.title} loading="lazy" />
        {showBadge && (
          <span className={`product-card__badge product-card__badge--${showBadge.kind}`}>
            {showBadge.text}
          </span>
        )}
      </div>
      <div className="product-card__body">
        <h3 className="product-card__title">{product.title}</h3>
        <div className="product-card__price">
          <span className={original ? 'product-card__now' : ''}>{formatPrice(pricing.current)}</span>
          {original && <span className="product-card__was">{formatPrice(original)}</span>}
        </div>
      </div>
    </Link>
  )
}
