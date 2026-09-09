import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAdminData } from '../../context/AdminDataContext.jsx'
import { formatDateTime, formatPrice } from '../../lib/format.js'
import { isWindowActive } from '../../lib/pricing.js'
import './AdminDiscountsPage.css'

function toLocalInput(date) {
  const d = new Date(date)
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

function defaultWindow() {
  const now = new Date()
  const end = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  return { percentage: '15', startsAt: toLocalInput(now), endsAt: toLocalInput(end) }
}

export default function AdminDiscountsPage() {
  const { isAdmin } = useAuth()
  const {
    products,
    storewideDiscount,
    productDiscounts,
    setStorewideDiscount,
    clearStorewideDiscount,
    setProductDiscount,
    clearProductDiscount,
    priceFor,
  } = useAdminData()

  const [storeForm, setStoreForm] = useState(defaultWindow)
  const [storeError, setStoreError] = useState(null)

  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [productForm, setProductForm] = useState(defaultWindow)
  const [productError, setProductError] = useState(null)

  function submitStore(e) {
    e.preventDefault()
    setStoreError(null)
    try {
      setStorewideDiscount({
        percentage: Number(storeForm.percentage),
        startsAt: storeForm.startsAt,
        endsAt: storeForm.endsAt,
      })
    } catch (err) {
      setStoreError(err.message)
    }
  }

  function submitProduct(e) {
    e.preventDefault()
    setProductError(null)
    try {
      setProductDiscount(productId, {
        percentage: Number(productForm.percentage),
        startsAt: productForm.startsAt,
        endsAt: productForm.endsAt,
      })
    } catch (err) {
      setProductError(err.message)
    }
  }

  const discountedRows = products
    .filter((p) => productDiscounts[p.id])
    .map((p) => {
      const win = productDiscounts[p.id]
      const active = isWindowActive(win.startsAt, win.endsAt)
      return { product: p, win, active, pricing: priceFor(p, 0) }
    })

  return (
    <AdminLayout title="Discounts" description="Storewide and per-product discount windows. Percentage 0–100, end after start.">
      {!isAdmin && <p className="admin-note">Sign in as an admin to persist discount windows to the API.</p>}

      <div className="admin-discounts__forms">
        <form className="card admin-discounts__form" onSubmit={submitStore}>
          <h2>Storewide discount</h2>
          {storeError && <p className="inline-error">{storeError}</p>}
          <div className="field">
            <label htmlFor="sw-pct">Percentage</label>
            <input
              id="sw-pct"
              type="number"
              value={storeForm.percentage}
              onChange={(e) => setStoreForm((f) => ({ ...f, percentage: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="sw-start">Starts</label>
            <input
              id="sw-start"
              type="datetime-local"
              value={storeForm.startsAt}
              onChange={(e) => setStoreForm((f) => ({ ...f, startsAt: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="sw-end">Ends</label>
            <input
              id="sw-end"
              type="datetime-local"
              value={storeForm.endsAt}
              onChange={(e) => setStoreForm((f) => ({ ...f, endsAt: e.target.value }))}
            />
          </div>
          <div className="admin-discounts__form-actions">
            <button type="submit" className="btn">
              Set storewide
            </button>
            {storewideDiscount && (
              <button type="button" className="btn btn--ghost" onClick={clearStorewideDiscount}>
                Clear
              </button>
            )}
          </div>
          {storewideDiscount && (
            <p className="admin-discounts__current">
              Current: {storewideDiscount.percentage}% ·{' '}
              {formatDateTime(storewideDiscount.startsAt)} → {formatDateTime(storewideDiscount.endsAt)}
              <span
                className={`admin-pill admin-pill--${
                  isWindowActive(storewideDiscount.startsAt, storewideDiscount.endsAt) ? 'on' : 'off'
                }`}
              >
                {isWindowActive(storewideDiscount.startsAt, storewideDiscount.endsAt)
                  ? 'Active'
                  : 'Scheduled / expired'}
              </span>
            </p>
          )}
        </form>

        <form className="card admin-discounts__form" onSubmit={submitProduct}>
          <h2>Per-product discount</h2>
          {productError && <p className="inline-error">{productError}</p>}
          <div className="field">
            <label htmlFor="pd-product">Product</label>
            <select id="pd-product" value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="pd-pct">Percentage</label>
            <input
              id="pd-pct"
              type="number"
              value={productForm.percentage}
              onChange={(e) => setProductForm((f) => ({ ...f, percentage: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="pd-start">Starts</label>
            <input
              id="pd-start"
              type="datetime-local"
              value={productForm.startsAt}
              onChange={(e) => setProductForm((f) => ({ ...f, startsAt: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="pd-end">Ends</label>
            <input
              id="pd-end"
              type="datetime-local"
              value={productForm.endsAt}
              onChange={(e) => setProductForm((f) => ({ ...f, endsAt: e.target.value }))}
            />
          </div>
          <div className="admin-discounts__form-actions">
            <button type="submit" className="btn">
              Set product discount
            </button>
          </div>
        </form>
      </div>

      <h2 className="admin-discounts__table-title">Configured product discounts</h2>
      {discountedRows.length === 0 ? (
        <p className="admin-note">No per-product discounts configured.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>%</th>
                <th>Window</th>
                <th>Status</th>
                <th>Live price</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {discountedRows.map(({ product, win, active, pricing }) => (
                <tr key={product.id}>
                  <td>{product.title}</td>
                  <td>{win.percentage}%</td>
                  <td>
                    {formatDateTime(win.startsAt)} → {formatDateTime(win.endsAt)}
                  </td>
                  <td>
                    <span className={`admin-pill admin-pill--${active ? 'on' : 'off'}`}>
                      {active ? 'Active' : 'Scheduled / expired'}
                    </span>
                  </td>
                  <td>
                    {formatPrice(pricing.current)}
                    {pricing.isDiscounted && (
                      <span className="admin-discounts__was"> {formatPrice(pricing.original)}</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="admin-btn-sm admin-btn-sm--danger"
                      onClick={() => clearProductDiscount(product.id)}
                    >
                      Clear
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
