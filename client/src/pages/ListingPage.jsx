import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import { categoryLabel, localByCategory, localSearch, PRODUCTS } from '../data/catalog.js'
import { fetchProducts } from '../api/products.js'
import './ListingPage.css'

function seedItems({ slug, q, top, deals }) {
  if (slug) return localByCategory(slug)
  if (q) return localSearch(q)
  if (top) return PRODUCTS.filter((p) => p.badge === 'top')
  if (deals) return PRODUCTS.filter((p) => p.badge === 'sale' || p.originalPrice)
  return PRODUCTS
}

export default function ListingPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const top = searchParams.get('top') === '1'
  const deals = searchParams.get('deals') === '1'

  const [items, setItems] = useState(() => seedItems({ slug, q, top, deals }))
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    setItems(seedItems({ slug, q, top, deals }))
    setMeta(null)

    const controller = new AbortController()
    fetchProducts({
      page: 1,
      pageSize: 200,
      category: slug || undefined,
      search: q || undefined,
      signal: controller.signal,
    })
      .then(({ items: fetched, meta: fetchedMeta }) => {
        let next = fetched
        if (top) next = fetched.filter((p) => p.badge === 'top')
        if (deals) next = fetched.filter((p) => p.badge === 'sale' || p.originalPrice)
        if (next.length || fetched.length) {
          setItems(next)
          setMeta(fetchedMeta)
        }
      })
      .catch(() => {
        /* keep the local seed */
      })
    return () => controller.abort()
  }, [slug, q, top, deals])

  let heading = 'All figures'
  if (slug) heading = categoryLabel(slug)
  else if (top) heading = 'Top figures'
  else if (deals) heading = 'Deals'
  else if (q) heading = `“${q}”`

  const count = meta?.totalCount ?? items.length

  return (
    <div className="listing page">
      <header className="listing__head">
        {q && !slug && !top && !deals && <span className="eyebrow">Search results for</span>}
        <h1 className="listing__title">{heading}</h1>
        <p className="listing__count">
          {count} {count === 1 ? 'figure' : 'figures'}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="listing__empty card">
          <h3>Nothing on this shelf</h3>
          <p>No figures matched. Try another world or a looser search.</p>
        </div>
      ) : (
        <div className="listing__grid">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
