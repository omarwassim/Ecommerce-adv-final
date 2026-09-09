import { useRef } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard.jsx'
import { ArrowLeftIcon, ArrowRightIcon } from './icons.jsx'
import './ProductRow.css'

const SCROLL_BY = 640

export default function ProductRow({ title, href, items }) {
  const scrollerRef = useRef(null)

  if (!items || items.length === 0) return null

  function scroll(dir) {
    scrollerRef.current?.scrollBy({ left: dir * SCROLL_BY, behavior: 'smooth' })
  }

  return (
    <section className="product-row">
      <div className="product-row__head">
        <h2 className="product-row__title">{title}</h2>
        <div className="product-row__controls">
          {href && (
            <Link to={href} className="product-row__see-all">
              See all
            </Link>
          )}
          <button className="product-row__arrow" onClick={() => scroll(-1)} aria-label="Scroll left">
            <ArrowLeftIcon />
          </button>
          <button className="product-row__arrow" onClick={() => scroll(1)} aria-label="Scroll right">
            <ArrowRightIcon />
          </button>
        </div>
      </div>
      <div className="product-row__scroller" ref={scrollerRef}>
        {items.map((p) => (
          <div className="product-row__item" key={p.id}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  )
}
