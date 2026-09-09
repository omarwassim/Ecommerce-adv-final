import { Link } from 'react-router-dom'
import { CATEGORIES } from '../data/catalog.js'
import { CloseIcon } from './icons.jsx'
import './CategoryDrawer.css'

export default function CategoryDrawer({ open, onClose }) {
  if (!open) return null

  return (
    <div className="drawer">
      <button className="drawer__scrim" aria-label="Close menu" onClick={onClose} />
      <aside className="drawer__panel" aria-label="Categories">
        <div className="drawer__head">
          <span className="eyebrow">Shop by world</span>
          <button className="drawer__close" onClick={onClose} aria-label="Close menu">
            <CloseIcon />
          </button>
        </div>
        <nav className="drawer__links">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to={`/category/${c.slug}`} className="drawer__link" onClick={onClose}>
              {c.label}
            </Link>
          ))}
          <Link to="/search?deals=1" className="drawer__link drawer__link--deal" onClick={onClose}>
            Deals
          </Link>
          <Link to="/assistant" className="drawer__link" onClick={onClose}>
            Ask Jarvis
          </Link>
        </nav>
      </aside>
    </div>
  )
}
