import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import { CATEGORIES, HERO_IMAGE, PRODUCTS } from '../data/catalog.js'
import { fetchProducts } from '../api/products.js'
import './HomePage.css'

const MARQUEE = [
  'FREE SHIPPING OVER EGP 3,000',
  'NUMBERED RUNS',
  'HAND-FINISHED CASTS',
  'NEW DROPS EVERY FRIDAY',
  'KEEP THE BOX',
]

export default function HomePage() {
  const [catalog, setCatalog] = useState(PRODUCTS)

  useEffect(() => {
    const controller = new AbortController()
    fetchProducts({ page: 1, pageSize: 200, signal: controller.signal })
      .then(({ items }) => {
        if (items.length) setCatalog(items)
      })
      .catch(() => {
        /* keep the local seed */
      })
    return () => controller.abort()
  }, [])

  const deals = catalog.filter((p) => p.badge === 'sale' || p.originalPrice).slice(0, 8)

  return (
    <div className="home">
      <section className="home__hero">
        <img src={HERO_IMAGE} alt="" className="home__hero-img" />
        <div className="home__hero-copy">
          <span className="eyebrow">Collectible action figures</span>
          <h1>
            Built to pose.
            <br />
            Made to keep.
          </h1>
          <p>Numbered casts across six worlds. Put them on a lit shelf where they belong.</p>
          <Link to="/category/heroes" className="btn btn--red">
            Shop the shelf
          </Link>
        </div>
      </section>

      <div className="home__marquee" aria-hidden="true">
        <div className="home__marquee-track">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="home__marquee-item">
              {m} <span className="home__marquee-dot">◆</span>
            </span>
          ))}
        </div>
      </div>

      <div className="page">
        {deals.length > 0 && (
          <section className="home__section">
            <div className="home__section-head">
              <h2>Deals</h2>
              <Link to="/search?deals=1" className="home__see-all">
                See all deals
              </Link>
            </div>
            <div className="home__grid">
              {deals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {CATEGORIES.map((cat) => {
          const items = catalog.filter((p) => p.category === cat.slug).slice(0, 4)
          if (items.length === 0) return null
          return (
            <section className="home__section" key={cat.slug}>
              <div className="home__section-head">
                <div>
                  <h2>{cat.label}</h2>
                  <p className="home__section-blurb">{cat.blurb}</p>
                </div>
                <Link to={`/category/${cat.slug}`} className="home__see-all">
                  See all
                </Link>
              </div>
              <div className="home__grid">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
