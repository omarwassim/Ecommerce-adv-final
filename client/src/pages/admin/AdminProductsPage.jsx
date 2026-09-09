import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAdminData } from '../../context/AdminDataContext.jsx'
import { CATEGORIES } from '../../data/catalog.js'
import { formatPrice } from '../../lib/format.js'
import './AdminProductsPage.css'

const EMPTY_FORM = {
  title: '',
  category: 'heroes',
  price: '',
  originalPrice: '',
  stock: '',
  image: '',
  description: '',
  badge: '',
  displayOrder: '',
}

export default function AdminProductsPage() {
  const { isAdmin } = useAuth()
  const { products, createProduct, updateProduct, removeProduct } = useAdminData()
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState(null)

  const sorted = [...products].sort(
    (a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0),
  )

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function startEdit(p) {
    setEditingId(p.id)
    setForm({
      title: p.title ?? '',
      category: p.category ?? 'heroes',
      price: String(p.price ?? ''),
      originalPrice: p.originalPrice != null ? String(p.originalPrice) : '',
      stock: p.stock != null ? String(p.stock) : '',
      image: p.image ?? '',
      description: p.description ?? '',
      badge: p.badge ?? '',
      displayOrder: p.displayOrder != null ? String(p.displayOrder) : '',
    })
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      if (editingId) updateProduct(editingId, form)
      else createProduct(form)
      resetForm()
    } catch (err) {
      setError(err.message)
    }
  }

  function handleDelete(p) {
    if (window.confirm(`Delete "${p.title}"? This can't be undone.`)) {
      removeProduct(p.id)
      if (editingId === p.id) resetForm()
    }
  }

  return (
    <AdminLayout title="Products" description="Create and edit the catalogue. Title and price are required.">
      {!isAdmin && (
        <p className="admin-note">
          Read-only preview — sign in as an admin to persist changes to the API.
        </p>
      )}

      <form className="card admin-products__form" onSubmit={handleSubmit}>
        <h2>{editingId ? `Edit product #${editingId}` : 'New product'}</h2>
        {error && <p className="inline-error">{error}</p>}

        <div className="admin-products__grid">
          <div className="field">
            <label htmlFor="p-title">Title *</label>
            <input id="p-title" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="p-category">Category</label>
            <select id="p-category" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="p-price">Price (EGP) *</label>
            <input id="p-price" type="number" value={form.price} onChange={(e) => set('price', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="p-original">Original price</label>
            <input
              id="p-original"
              type="number"
              value={form.originalPrice}
              onChange={(e) => set('originalPrice', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="p-stock">Stock</label>
            <input id="p-stock" type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="p-order">Display order</label>
            <input
              id="p-order"
              type="number"
              placeholder="auto (end of list)"
              value={form.displayOrder}
              onChange={(e) => set('displayOrder', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="p-badge">Badge</label>
            <select id="p-badge" value={form.badge} onChange={(e) => set('badge', e.target.value)}>
              <option value="">None</option>
              <option value="top">Top</option>
              <option value="sale">Sale</option>
            </select>
          </div>
          <div className="field admin-products__wide">
            <label htmlFor="p-image">Photo URL</label>
            <input id="p-image" value={form.image} onChange={(e) => set('image', e.target.value)} />
          </div>
          <div className="field admin-products__wide">
            <label htmlFor="p-desc">Description</label>
            <textarea
              id="p-desc"
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
        </div>

        <div className="admin-products__form-actions">
          <button type="submit" className="btn">
            {editingId ? 'Save changes' : 'Create product'}
          </button>
          {editingId && (
            <button type="button" className="btn btn--ghost" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="admin-table-wrap admin-products__table">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Photo</th>
              <th>Title</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id}>
                <td>{p.displayOrder}</td>
                <td>
                  <img className="admin-table__thumb" src={p.image} alt="" />
                </td>
                <td>{p.title}</td>
                <td>{p.category}</td>
                <td>{formatPrice(p.price)}</td>
                <td>{p.stock ?? 0}</td>
                <td>
                  <div className="admin-table__actions">
                    <button className="admin-btn-sm" onClick={() => startEdit(p)}>
                      Edit
                    </button>
                    <button
                      className="admin-btn-sm admin-btn-sm--danger"
                      onClick={() => handleDelete(p)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}
