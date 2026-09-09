import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { CATEGORIES } from '../data/catalog.js'
import './Footer.css'

export default function Footer() {
  const { user } = useAuth()

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__col">
          <h4 className="footer__title">Worlds</h4>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to={`/category/${c.slug}`} className="footer__link">
              {c.label}
            </Link>
          ))}
        </div>

        <div className="footer__col">
          <h4 className="footer__title">Help</h4>
          <Link to="/account" className="footer__link">
            Account
          </Link>
          <Link to="/orders" className="footer__link">
            Orders
          </Link>
          <Link to="/cart" className="footer__link">
            Bag
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="footer__link">
              Admin
            </Link>
          )}
        </div>

        <div className="footer__col footer__col--blurb">
          <span className="footer__mark">
            <span className="footer__mark-dot">Eg</span> Figures
          </span>
          <p>
            Collectible action figures for people who keep the box. Hand-finished casts,
            numbered runs, and a lit shelf to put them on.
          </p>
          <p className="footer__fine">© {new Date().getFullYear()} Eg Figures — all poses reserved.</p>
        </div>
      </div>
    </footer>
  )
}
