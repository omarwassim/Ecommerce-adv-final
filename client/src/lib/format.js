// Prices always formatted as `EGP 1,234` — no decimals.
export function formatPrice(amount, currency = 'EGP') {
  const n = Math.round(Number(amount) || 0)
  return `${currency} ${n.toLocaleString('en-US')}`
}

export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// "expires in Xh Ym" style countdown from now to a future timestamp.
export function formatCountdown(expiresAt) {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'expired'
  const totalMinutes = Math.floor(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h <= 0) return `${m}m`
  return `${h}h ${m}m`
}
