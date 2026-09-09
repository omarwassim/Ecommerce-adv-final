import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { CATEGORIES } from '../data/catalog.js'
import {
  BagIcon,
  ChevronIcon,
  HeartIcon,
  HomeIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from './icons.jsx'
import './Header.css'

export default function Header({ onOpenMenu }) {
  const { count } = useCart()
  const { isAuthed } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [collectionsOpen, setCollectionsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Re-hydrate the box from the URL when landing on /search.
  useEffect(() => {
    if (location.pathname === '/search') {
      setQuery(searchParams.get('q') ?? '')
    }
  }, [location.pathname, searchParams])

  // Close the dropdown on route change.
  useEffect(() => {
    setCollectionsOpen(false)
  }, [location.pathname, location.search])

  // Close on outside pointerdown.
  useEffect(() => {
    if (!collectionsOpen) return
    function onPointerDown(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCollectionsOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [collectionsOpen])

  function onSubmit(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="header">
      <div className="header__bar">
        <button className="header__icon-btn header__hamburger" onClick={onOpenMenu} aria-label="Open menu">
          <MenuIcon />
        </button>

        <Link to="/" className="header__brand">
          <span className="header__brand-dot">Eg</span> Figures
        </Link>

        <nav className="header__nav" aria-label="Primary">
          <NavLink to="/search" className="header__nav-link" end>
            All figures
          </NavLink>

          <div
            className="header__collections"
            ref={dropdownRef}
            onMouseEnter={() => setCollectionsOpen(true)}
            onMouseLeave={() => setCollectionsOpen(false)}
          >
            <button
              type="button"
              className="header__nav-link header__nav-link--btn"
              aria-expanded={collectionsOpen}
              aria-haspopup="true"
              onClick={() => setCollectionsOpen((v) => !v)}
            >
              Shop by world <ChevronIcon size={16} />
            </button>
            {collectionsOpen && (
              <div className="header__dropdown" role="menu">
                {CATEGORIES.map((c) => (
                  <Link key={c.slug} to={`/category/${c.slug}`} role="menuitem" className="header__dropdown-item">
                    {c.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <NavLink to="/search?top=1" className="header__nav-link">
            Top figures
          </NavLink>
          <NavLink to="/search?deals=1" className="header__nav-link header__nav-link--deal">
            Deals
          </NavLink>
        </nav>

        <form className="header__search" role="search" onSubmit={onSubmit}>
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search figures…"
            aria-label="Search figures"
          />
        </form>

        <div className="header__icons">
          <NavLink to="/" className="header__icon-btn" aria-label="Home" end>
            <HomeIcon />
          </NavLink>
          <NavLink to="/account" className="header__icon-btn" aria-label={isAuthed ? 'Account' : 'Sign in'}>
            <UserIcon />
          </NavLink>
          <NavLink to="/orders" className="header__icon-btn" aria-label="Your orders">
            <HeartIcon />
          </NavLink>
          <NavLink to="/cart" className="header__icon-btn header__cart" aria-label={`Bag, ${count} items`}>
            <BagIcon />
            {count > 0 && <span className="header__badge">{count}</span>}
          </NavLink>
        </div>
      </div>
    </header>
  )
}
