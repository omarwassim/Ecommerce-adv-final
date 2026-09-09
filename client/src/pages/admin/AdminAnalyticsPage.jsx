import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatPrice } from '../../lib/format.js'
import { barWidth, rankBy, shareOfTotal } from '../../lib/analytics.js'
import { fetchSalesAnalytics } from '../../api/admin.js'
import { DUMMY_SALES } from '../../data/dummy.js'
import './AdminAnalyticsPage.css'

const TOP_OPTIONS = [5, 10, 16]

export default function AdminAnalyticsPage() {
  const { isAdmin, token } = useAuth()
  // Live from GET /admin/analytics/sales when available; demo bars otherwise.
  const [sales, setSales] = useState(null)
  const [isDemo, setIsDemo] = useState(false)
  const [topN, setTopN] = useState(5)
  const [metric, setMetric] = useState('units') // 'units' | 'revenue'

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false

    fetchSalesAnalytics(16)
      .then((rows) => {
        if (cancelled) return
        if (rows.length) {
          setSales(rows)
          setIsDemo(false)
        } else {
          throw new Error('empty')
        }
      })
      .catch(() => {
        if (cancelled) return
        setSales(DUMMY_SALES)
        setIsDemo(true)
      })

    return () => {
      cancelled = true
    }
  }, [isAdmin, token])

  if (!isAdmin) {
    return (
      <AdminLayout title="Analytics" description="Best-seller charts and sales distribution.">
        <p className="admin-note">Analytics are admin-only. Sign in as an admin to view them.</p>
      </AdminLayout>
    )
  }

  const rows = sales ?? []
  const ranked = rankBy(rows, metric)
  const mostSold = ranked.slice(0, topN)
  const maxOfTop = mostSold[0]?.[metric] ?? 0

  const distribution = ranked.slice(0, 8)
  const distTotal = ranked.reduce((sum, r) => sum + r[metric], 0)

  const fmt = (v) => (metric === 'revenue' ? formatPrice(v) : `${v} units`)

  return (
    <AdminLayout title="Analytics" description="Best-seller charts and sales distribution across the catalogue.">
      {isDemo && (
        <p className="admin-note admin-note--warn">
          Showing demo figures — <code>GET /admin/analytics/sales</code> returned nothing (needs a
          running API with order data).
        </p>
      )}

      <section className="analytics__section card">
        <div className="analytics__controls">
          <h2>Most sold</h2>
          <div className="analytics__toggles">
            <div className="analytics__seg" role="group" aria-label="Metric">
              <button
                className={metric === 'units' ? 'is-on' : ''}
                onClick={() => setMetric('units')}
              >
                Units
              </button>
              <button
                className={metric === 'revenue' ? 'is-on' : ''}
                onClick={() => setMetric('revenue')}
              >
                Revenue
              </button>
            </div>
            <div className="analytics__seg" role="group" aria-label="How many">
              {TOP_OPTIONS.map((n) => (
                <button key={n} className={topN === n ? 'is-on' : ''} onClick={() => setTopN(n)}>
                  Top {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {mostSold.length === 0 ? (
          <p className="analytics__empty">Nothing to chart yet.</p>
        ) : (
          <ul className="analytics__bars">
            {mostSold.map((r) => (
              <li key={r.productId}>
                <span className="analytics__bar-label">{r.name}</span>
                <span className="analytics__bar-track">
                  <span
                    className="analytics__bar-fill"
                    style={{ width: `${barWidth(r[metric], maxOfTop)}%` }}
                  />
                </span>
                <span className="analytics__bar-value">{fmt(r[metric])}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="analytics__section card">
        <h2>Sales distribution</h2>
        <p className="analytics__sub">Top 8 by {metric}, each as a share of the {metric} total.</p>
        {distribution.length === 0 ? (
          <p className="analytics__empty">Nothing to chart yet.</p>
        ) : (
          <ul className="analytics__bars">
            {distribution.map((r) => {
              const share = shareOfTotal(r[metric], distTotal)
              return (
                <li key={r.productId}>
                  <span className="analytics__bar-label">{r.name}</span>
                  <span className="analytics__bar-track">
                    <span
                      className="analytics__bar-fill analytics__bar-fill--alt"
                      style={{ width: `${share}%` }}
                    />
                  </span>
                  <span className="analytics__bar-value">{share.toFixed(1)}%</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </AdminLayout>
  )
}
