import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAdminData } from '../context/AdminDataContext.jsx'
import { getSizeSurcharge } from '../lib/pricing.js'
import { formatPrice } from '../lib/format.js'
import { localById } from '../data/catalog.js'
import { fetchProductById } from '../api/products.js'
import './ProductPage.css'

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { getProduct, priceFor } = useAdminData()

  const [product, setProduct] = useState(() => getProduct(id) ?? localById(id))
  const [loadedId, setLoadedId] = useState(id)
  const [colorOverride, setColorOverride] = useState(null)
  const [sizeOverride, setSizeOverride] = useState(null)

  // Reset variant selection on product-id change, mid-render (not an effect) —
  // avoids an extra render pass when navigating directly between two products.
  if (id !== loadedId) {
    setLoadedId(id)
    setColorOverride(null)
    setSizeOverride(null)
    setProduct(getProduct(id) ?? localById(id))
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchProductById(id, { signal: controller.signal })
      .then((fetched) => {
        if (fetched && fetched.id === id) setProduct(fetched)
      })
      .catch(() => {
        /* keep the local seed */
      })
    return () => controller.abort()
  }, [id])

  if (!product) {
    return (
      <div className="product page">
        <div className="card product__missing">
          <h1>Figure not found</h1>
          <p>This one may have sold out of its run.</p>
          <Link to="/search" className="btn">
            Back to the shelf
          </Link>
        </div>
      </div>
    )
  }

  const sizes = product.sizes ?? []
  const colors = product.colors ?? []
  const sizeIndex = sizeOverride ?? 0
  const color = colorOverride ?? colors[0] ?? null
  const size = sizes[sizeIndex] ?? null

  const pricing = priceFor(product, sizeIndex)

  function handleAdd() {
    addItem(product, { color, size, qty: 1, unitPrice: pricing.current })
  }

  function handleBuyNow() {
    handleAdd()
    navigate('/checkout')
  }

  return (
    <div className="product page">
      <div className="product__layout">
        <div className="product__gallery">
          <img src={product.image} alt={product.title} />
          {pricing.isDiscounted && (
            <span className="product__flag">-{Math.round(pricing.discount.percentage)}%</span>
          )}
        </div>

        <div className="product__info">
          <span className="eyebrow">
            <Link to={`/category/${product.category}`}>{product.category}</Link>
          </span>
          <h1 className="product__title">{product.title}</h1>

          <div className="product__price">
            <span className={pricing.isDiscounted ? 'product__price-now' : ''}>
              {formatPrice(pricing.current)}
            </span>
            {pricing.isDiscounted && (
              <span className="product__price-was">{formatPrice(pricing.original)}</span>
            )}
          </div>

          {pricing.surcharge > 0 && (
            <p className="product__surcharge-note">
              Includes a {formatPrice(pricing.surcharge)} size surcharge for{' '}
              <strong>{size}</strong>. The base {sizes[0]} size has no surcharge.
            </p>
          )}

          <p className="product__desc">{product.description}</p>

          {colors.length > 0 && (
            <fieldset className="product__variants">
              <legend>Colour{color ? `: ${color}` : ''}</legend>
              <div className="product__swatches">
                {colors.map((c) => (
                  <label
                    key={c}
                    className={`product__swatch${c === color ? ' product__swatch--on' : ''}`}
                  >
                    <input
                      type="radio"
                      name="color"
                      value={c}
                      checked={c === color}
                      onChange={() => setColorOverride(c)}
                    />
                    {c}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {sizes.length > 0 && (
            <fieldset className="product__variants">
              <legend>Size</legend>
              <div className="product__sizes">
                {sizes.map((s, i) => {
                  const delta = getSizeSurcharge(product.price, i)
                  return (
                    <label
                      key={s}
                      className={`product__size${i === sizeIndex ? ' product__size--on' : ''}`}
                    >
                      <input
                        type="radio"
                        name="size"
                        value={s}
                        checked={i === sizeIndex}
                        onChange={() => setSizeOverride(i)}
                      />
                      <span>{s}</span>
                      <span className="product__size-delta">
                        {delta > 0 ? `+${formatPrice(delta)}` : 'base'}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}

          <div className="product__actions">
            <button className="btn btn--block" onClick={handleAdd}>
              Add to bag
            </button>
            <button className="btn btn--ghost btn--block" onClick={handleBuyNow}>
              Buy now
            </button>
          </div>

          <p className="product__stock">
            {product.stock > 0 ? `${product.stock} left in this run` : 'Sold out of this run'}
          </p>
        </div>
      </div>
    </div>
  )
}
