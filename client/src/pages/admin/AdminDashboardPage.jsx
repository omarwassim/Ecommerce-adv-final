import { Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAdminData } from '../../context/AdminDataContext.jsx'
import { formatDateTime, formatPrice } from '../../lib/format.js'
import { isWindowActive } from '../../lib/pricing.js'
import { loadLocalOrders } from '../../lib/localOrders.js'
import { DUMMY_ORDER_STATS } from '../../data/dummy.js'
import './AdminDashboardPage.css'

export default function AdminDashboardPage() {
  const { isAuthed, isAdmin, user } = useAuth()
  const { products, storewideDiscount, auditLog } = useAdminData()

  // Product / stock / discount / activity figures are real (AdminDataContext).
  // Order + revenue have no backend endpoint — placeholder totals, plus a nudge
  // from any orders placed in this browser.
  const localOrders = loadLocalOrders(user?.id)
  const totalOrders = DUMMY_ORDER_STATS.totalOrders + localOrders.length
  const revenue =
    DUMMY_ORDER_STATS.revenue + localOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)

  const outOfStock = products.filter((p) => (p.stock ?? 0) <= 0).length
  const storewideActive =
    storewideDiscount && isWindowActive(storewideDiscount.startsAt, storewideDiscount.endsAt)

  return (
    <AdminLayout title="Dashboard" description="Store overview, storewide discount, and recent admin activity.">
      {!isAuthed && (
        <p className="admin-note">
          You're not signed in. <Link to="/account">Sign in</Link> as an admin to see order figures.
        </p>
      )}
      {isAuthed && !isAdmin && (
        <p className="admin-note">Your account isn't an admin — order and revenue figures are hidden.</p>
      )}
      {isAdmin && (
        <p className="admin-note">
          Orders &amp; Revenue are demo placeholders — the API has no <code>GET /orders</code>{' '}
          endpoint. Products, stock, discounts and activity are live.
        </p>
      )}

      <div className="admin-stats">
        <div className="admin-stat card">
          <span className="admin-stat__label">Products</span>
          <span className="admin-stat__value">{products.length}</span>
        </div>
        <div className="admin-stat card">
          <span className="admin-stat__label">Out of stock</span>
          <span className="admin-stat__value">{outOfStock}</span>
        </div>
        <div className="admin-stat card">
          <span className="admin-stat__label">Orders</span>
          <span className="admin-stat__value">{isAdmin ? totalOrders : '—'}</span>
        </div>
        <div className="admin-stat card">
          <span className="admin-stat__label">Revenue</span>
          <span className="admin-stat__value">{isAdmin ? formatPrice(revenue) : '—'}</span>
        </div>
      </div>

      <div className="admin-dash__cols">
        <section className="card admin-dash__panel">
          <h2>Storewide discount</h2>
          {storewideDiscount ? (
            <>
              <p className="admin-dash__big">
                {storewideDiscount.percentage}% off
                <span className={`admin-pill admin-pill--${storewideActive ? 'on' : 'off'}`}>
                  {storewideActive ? 'Active' : 'Scheduled / expired'}
                </span>
              </p>
              <p className="admin-dash__muted">
                {formatDateTime(storewideDiscount.startsAt)} → {formatDateTime(storewideDiscount.endsAt)}
              </p>
            </>
          ) : (
            <p className="admin-dash__muted">No storewide discount configured.</p>
          )}
          <Link to="/admin/discounts" className="btn btn--ghost">
            Manage discounts
          </Link>
        </section>

        <section className="card admin-dash__panel">
          <h2>Recent activity</h2>
          {auditLog.length === 0 ? (
            <p className="admin-dash__muted">No admin write actions recorded yet.</p>
          ) : (
            <ul className="admin-dash__activity">
              {auditLog.slice(0, 5).map((entry) => (
                <li key={entry.id}>
                  <span className="admin-dash__activity-action">
                    {entry.action} {entry.entityType}
                  </span>
                  <span className="admin-dash__activity-summary">{entry.summary}</span>
                  <span className="admin-dash__activity-time">{formatDateTime(entry.at)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/audit-log" className="btn btn--ghost">
            Full audit log
          </Link>
        </section>
      </div>
    </AdminLayout>
  )
}
