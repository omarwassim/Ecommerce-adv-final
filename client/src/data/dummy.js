// Placeholder data for UI surfaces whose backend endpoints don't exist yet.
// The .NET API currently exposes NO:
//   GET /orders            -> OrdersPage, AdminDashboardPage order stats
//   POST /ai/search        -> AssistantPage
// These sections stay in the UI, populated from here, so the layout is complete
// and obviously "demo data" rather than silently broken.

export const DUMMY_ORDERS = [
  {
    id: 'FIG-2041',
    status: 'confirmed',
    total: 3260,
    createdAt: '2026-09-01T14:22:00Z',
    items: [
      { productId: '101', productName: 'Caped Vanguard 7" Figure', unitPriceSnapshot: 1450, qty: 1, lineTotal: 1450 },
      { productId: '301', productName: 'Red Courier Mech', unitPriceSnapshot: 1810, qty: 1, lineTotal: 1810 },
    ],
  },
  {
    id: 'FIG-2039',
    status: 'paid',
    total: 1246,
    createdAt: '2026-08-27T09:05:00Z',
    items: [
      { productId: '502', productName: 'Vintage Mouse Mascot', unitPriceSnapshot: 990, qty: 1, lineTotal: 990 },
      { productId: '505', productName: 'Retro Vinyl Idol', unitPriceSnapshot: 256, qty: 1, lineTotal: 256 },
    ],
  },
  {
    id: 'FIG-2033',
    status: 'compensated',
    total: 4250,
    createdAt: '2026-08-19T18:40:00Z',
    items: [
      { productId: '402', productName: 'Gourd Colossus', unitPriceSnapshot: 4250, qty: 1, lineTotal: 4250 },
    ],
  },
]

// Rough revenue/order figures shown on the admin dashboard as placeholders.
export const DUMMY_ORDER_STATS = {
  totalOrders: 128,
  revenue: 342_900,
}

// Fallback bars for the analytics page if GET /admin/analytics/sales returns nothing.
export const DUMMY_SALES = [
  { productId: '301', name: 'Red Courier Mech', units: 64, revenue: 184_960 },
  { productId: '101', name: 'Caped Vanguard 7" Figure', units: 58, revenue: 84_100 },
  { productId: '401', name: 'Rift Behemoth (Deluxe)', units: 41, revenue: 163_590 },
  { productId: '201', name: 'Rift Horror Figure', units: 37, revenue: 63_640 },
  { productId: '601', name: 'Bronze Warrior Statuette', units: 33, revenue: 58_740 },
  { productId: '501', name: 'Arcade Bros 3-Pack', units: 31, revenue: 27_590 },
  { productId: '302', name: 'Cobalt-Gold Combat Unit', units: 28, revenue: 88_200 },
  { productId: '202', name: 'Hollow Lantern Figure', units: 24, revenue: 47_760 },
  { productId: '104', name: 'Masked Defender Figure', units: 19, revenue: 39_900 },
  { productId: '404', name: 'Magma Hatchling', units: 14, revenue: 64_260 },
]

// Canned assistant replies keyed by simple intent — used when the AI endpoint is absent.
export const DUMMY_ASSISTANT_REPLIES = {
  greeting: "I'm running in demo mode (no AI endpoint wired yet), but I can still match against the catalogue. Try a world, a name, or a budget like “under 2000”.",
  nomatch:
    "Demo mode: nothing in the catalogue matched that. Try “mecha”, “kaiju”, “retro”, a character name, or a budget.",
  match: (n, q) => `Demo mode — ${n} catalogue ${n === 1 ? 'match' : 'matches'} for “${q}”:`,
}
