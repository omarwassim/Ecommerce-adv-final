import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import CategoryDrawer from './CategoryDrawer.jsx'
import Footer from './Footer.jsx'
import FigureAgent from './FigureAgent.jsx'
import './Layout.css'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="layout">
      <Header onOpenMenu={() => setMenuOpen(true)} />
      <CategoryDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="layout__main">
        <Outlet />
      </main>
      <Footer />
      <FigureAgent />
    </div>
  )
}
