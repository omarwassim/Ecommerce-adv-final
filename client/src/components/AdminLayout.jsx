import { NavLink } from 'react-router-dom'
import './AdminLayout.css'

const TABS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/discounts', label: 'Discounts' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/audit-log', label: 'Audit log' },
]

export default function AdminLayout({ title, description, children }) {
  return (
    <div className="admin-layout page">
      <header className="admin-layout__head">
        <span className="eyebrow">Eg Figures admin</span>
        <h1 className="admin-layout__title">{title}</h1>
        {description && <p className="admin-layout__desc">{description}</p>}
      </header>

      <nav className="admin-layout__tabs" aria-label="Admin sections">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `admin-layout__tab${isActive ? ' admin-layout__tab--active' : ''}`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      <div className="admin-layout__body">{children}</div>
    </div>
  )
}
