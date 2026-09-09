// Static local catalogue. Pages seed their state from this synchronously so the
// first paint is never blank, then replace it with fetched data when the API
// responds (and silently fall back to this if the fetch fails).
//
// Product images are real Unsplash photos of action figures / collectible
// figures, grouped by category so each figure gets an on-theme shot.

export const CATEGORIES = [
  { slug: 'heroes', label: 'Heroes', blurb: 'Capes, cowls, and questionable secret identities.' },
  { slug: 'villains', label: 'Villains', blurb: 'The ones with the better monologues.' },
  { slug: 'mecha', label: 'Mecha', blurb: 'Piloted, panel-lined, and pointed at the sky.' },
  { slug: 'kaiju', label: 'Kaiju', blurb: 'City-block scale. Handle with forklift.' },
  { slug: 'retro', label: 'Retro', blurb: 'Blister-pack energy, reissued for the shelf.' },
  { slug: 'fantasy', label: 'Fantasy', blurb: 'Swords, spellbooks, and improbable pauldrons.' },
]

export const categoryLabel = (slug) =>
  CATEGORIES.find((c) => c.slug === slug)?.label ?? slug

// Unsplash raw-image helper. Every id below was verified to return 200.
const U = (id, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

// Action-figure photos grouped by category so each figure gets an on-theme shot.
export const FIGURE_IMAGES = {
  heroes: [
    '1558679908-541bcf1249ff', // Superman action figure
    '1702138129392-364adea0ad00', // figure in a superman suit
    '1557985594-29f3ad9f5134', // Spider-Man (Iron Spider) figure
    '1691315035852-9acb0bf34197', // superhero costume figure
    '1702138129409-7b4ff859ae5d', // figurine on a table
    '1610888301741-26d484c42647', // cartoon-character vinyl figures
  ],
  villains: [
    '1766823133022-5644e9cb21ac', // faceless petal-mawed monster figure
    '1628280656090-e89312646704', // carved-gourd-head caped figure
    '1663387124951-ff3eade18de5', // cloaked figure on a stand
    '1780726624500-8de106966b6f', // pile of scattered wrestling figures
    '1610888301962-06b307044bf0', // cartoon villain figure
    '1640271443625-3276ed8f62b5', // orange fiend figure
  ],
  mecha: [
    '1608278047522-58806a6ac85b', // red-and-white robot toy
    '1630710478039-9c680b99f800', // blue-and-yellow robot action figure
    '1700909415800-6d2a5a83a234', // toy robot standing
    '1527430253228-e93688616381', // blue plastic robot toy
    '1546776230-bb86256870ce', // grey-and-orange plastic robot toy
    '1582571352032-448f7928eca3', // blue-and-purple robot toy
    '1546776310-eef45dd6d63c', // grey-and-white robot
    '1619023495338-ae6fa7307819', // grey-and-white robot toy figure
  ],
  kaiju: [
    '1766823133022-5644e9cb21ac', // Demogorgon toy
    '1628280656090-e89312646704', // jack-o'-lantern figure
    '1607203694607-2fde6bb0724c', // owl figurine
    '1640271443625-3276ed8f62b5', // orange toy figure
    '1663387124951-ff3eade18de5', // toy figure on a stand
  ],
  retro: [
    '1566576912321-d58ddd7a6088', // Mario / Luigi / Peach figurines
    '1589419621083-1ead66c96fa7', // Mickey Mouse collectible
    '1597422232698-1a27a1289cea', // lego minifigure
    '1623295783032-6af0e569659e', // pop vinyl figure in packaging
    '1659650928788-931c01c98d46', // vinyl figure display
    '1565991331922-7f5ff7a2f615', // vinyl figure display
  ],
  fantasy: [
    '1578984242970-84c0b420e65a', // warrior statuette
    '1578632749014-ca77efd052eb', // anime character figure
    '1627672360124-4ed09583e14c', // anime figurine
    '1712698829933-9918ff32f22a', // small collectible figurine
    '1712698724026-d104f66c7cb0', // close-up collectible figurine
    '1606663889134-b1dedb5ed8b7', // action figure toy
  ],
}

const FALLBACK_IMAGES = FIGURE_IMAGES.heroes

export function figureImage(category, index = 0) {
  const list = FIGURE_IMAGES[category] || FALLBACK_IMAGES
  return U(list[index % list.length])
}

// Wide cover shot for the home hero — a lineup of superhero / villain figures.
export const HERO_IMAGE = U('1556707752-481d500a2c58', 1600)

function make(id, category, title, price, opts = {}) {
  return {
    id: String(id),
    category,
    title,
    price,
    currency: 'EGP',
    description:
      opts.description ??
      `${title} — a display-ready collectible: detailed sculpt, custom paint apps, and a matching base. Cast in premium resin, individually numbered.`,
    image: opts.image ?? null, // filled in by the per-category pass below
    stock: opts.stock ?? 12,
    colors: opts.colors ?? ['Classic', 'Midnight', 'Bone'],
    sizes: opts.sizes ?? ['4"', '7"', '12"'],
    badge: opts.badge ?? null, // 'sale' | 'top' | null
    originalPrice: opts.originalPrice ?? null,
    displayOrder: id,
    source: 'local',
  }
}

// Names describe the actual figure shown in each product's photo (images are
// assigned in category order by the pass below — keep these rows in that order).
export const PRODUCTS = [
  // heroes — caped / costumed hero figures
  make(101, 'heroes', 'Caped Vanguard 7" Figure', 1450, {
    badge: 'top',
    description:
      'Classic caped hero in a blue-and-red suit, fists clenched, cape sculpted mid-billow. Comes with a clip-on flight stand.',
  }),
  make(102, 'heroes', 'Skybound Paragon Figure', 1890, {
    badge: 'sale',
    originalPrice: 2200,
    description: 'Square-jawed flying hero, arms crossed, on a chrome display base. Cloth-look cape in painted resin.',
  }),
  make(103, 'heroes', 'Web-Slinger Prime Figure', 1250, {
    description: 'Armoured arachnid hero in a wall-crawl pose, extra bent legs, fully articulated for web-shot dioramas.',
  }),
  make(104, 'heroes', 'Masked Defender Figure', 2100, {
    sizes: ['6"', '10"'],
    colors: ['Signal Red', 'Cobalt', 'Ink'],
    description: 'Full-costume masked hero with a swappable unmasked head and two sets of gauntleted hands.',
  }),
  make(105, 'heroes', 'Desk Guardian Mini Figure', 1620, {
    badge: 'top',
    description: 'Palm-sized standing hero, painted-tabletop finish — the one that sits on your monitor stand.',
  }),
  make(106, 'heroes', 'Hero Vinyl 3-Pack', 1380, {
    description: 'Three stylised big-head vinyl heroes — a team set on a shared window-box base.',
  }),

  // villains — monsters, masked baddies, rogues
  make(201, 'villains', 'Rift Horror Figure', 1720, {
    badge: 'top',
    description: 'Faceless monster with a petal-split mouth, hunched and clawed. Textured skin, glow-wash interior.',
  }),
  make(202, 'villains', 'Hollow Lantern Figure', 1990, {
    badge: 'sale',
    originalPrice: 2400,
    description: 'Carved-gourd head on a caped body, candle-glow paint inside the grin. Translucent parts included.',
  }),
  make(203, 'villains', 'Cloaked Adversary Figure', 1550, {
    colors: ['Matte Black', 'Chrome'],
    description: 'Hooded villain on a tall pin-base, robe sculpted in a wind-swept flare, hidden-face variant head.',
  }),
  make(204, 'villains', 'Rogues Multipack (6 Figures)', 2450, {
    sizes: ['3.75"', '6"', '9"', '12"'],
    description: 'A crew of six colourful heel wrestlers / henchmen figures, loose in the box — build your rogues gallery.',
  }),
  make(205, 'villains', 'Saturday-Morning Menace Figure', 1180, {
    description: 'Big-nosed cartoon villain figure, exaggerated sneer, oversized boots — pure retro-toon energy.',
  }),
  make(206, 'villains', 'Amber Fiend Figure', 1640, {
    description: 'Solid amber-orange creature figure, spined back, snarling head sculpt on a rock base.',
  }),

  // mecha — robot / mech figures
  make(301, 'mecha', 'Red Courier Mech', 2890, {
    badge: 'top',
    sizes: ['6"', '10"'],
    description: 'Red-and-white humanoid robot with a boxy head and antenna, posable arms, die-cast feet.',
  }),
  make(302, 'mecha', 'Cobalt-Gold Combat Unit', 3150, {
    badge: 'sale',
    originalPrice: 3600,
    description: 'Blue-and-yellow battle mech, chunky shoulder armour, snap-on blaster and shield.',
  }),
  make(303, 'mecha', 'Standing Sentry Bot', 2450, {
    description: 'Full-height patrol robot in a neutral stance, light-up chest panel, magnetised hands.',
  }),
  make(304, 'mecha', 'Azure Automaton', 3390, {
    colors: ['Signal Red', 'Cobalt', 'Ink'],
    description: 'All-blue retro automaton, riveted plating, wind-up-look key on the back (decorative).',
  }),
  make(305, 'mecha', 'Rust Patrol Mech', 2620, {
    description: 'Grey-and-orange worker mech with a weathered paint job, tool-arm swap parts included.',
  }),
  make(306, 'mecha', 'Violet Vanguard Mech', 3890, {
    sizes: ['10"', '16"'],
    description: 'Purple-and-blue heavy mech, opening cockpit, oversized backpack thrusters.',
  }),

  // kaiju — giant-monster figures
  make(401, 'kaiju', 'Rift Behemoth (Deluxe)', 3990, {
    badge: 'top',
    sizes: ['8"', '14"'],
    description: 'Scaled-up version of the petal-mawed monster, rooted stance, articulated limbs and jaw.',
  }),
  make(402, 'kaiju', 'Gourd Colossus', 4250, {
    badge: 'sale',
    originalPrice: 4900,
    description: 'Towering pumpkin-headed titan, vine-wrapped limbs, internal glow effect.',
  }),
  make(403, 'kaiju', 'Great Horned Strix', 3650, {
    description: 'Giant owl-beast figure, feather-by-feather sculpt, wings that peg into a spread or folded pose.',
  }),
  make(404, 'kaiju', 'Magma Hatchling', 4590, {
    sizes: ['10"', '18"'],
    description: 'Molten-orange young kaiju, cracked-rock skin, translucent fins lit from within.',
  }),
  make(405, 'kaiju', 'Warden Titan', 3480, {
    description: 'Monolithic guardian figure on a ruin base — the one that dwarfs the rest of the shelf.',
  }),

  // retro — vintage / classic-toy figures
  make(501, 'retro', 'Arcade Bros 3-Pack', 890, {
    badge: 'top',
    colors: ['Sunburst', 'Steel', 'Classic'],
    description: 'Three pixel-era platform heroes — red cap, green cap, and the crowned one — on a warp-pipe base.',
  }),
  make(502, 'retro', 'Vintage Mouse Mascot', 990, {
    badge: 'sale',
    originalPrice: 1250,
    description: 'Rubber-hose-era cartoon mouse mascot, white gloves, pie-cut eyes, glossy vintage finish.',
  }),
  make(503, 'retro', 'Brick Minifigure (Classic)', 1120, {
    description: 'Oversized building-brick minifigure, cylinder head, C-grip hands, swappable printed torsos.',
  }),
  make(504, 'retro', 'Boxed Vinyl Collectible', 940, {
    description: 'Big-head vinyl figure sealed in a window box — mint-on-card display piece, do not open (or do).',
  }),
  make(505, 'retro', 'Retro Vinyl Idol', 1080, {
    description: 'Glossy stylised vinyl figure on a stepped plinth — the centrepiece of a shelf of pops.',
  }),

  // fantasy — warriors, knights, anime scale figures
  make(601, 'fantasy', 'Bronze Warrior Statuette', 1780, {
    badge: 'top',
    description: 'Standing warrior statuette in bronze-look finish, layered armour, spear and round shield.',
  }),
  make(602, 'fantasy', 'Anime Heroine 1/7 Scale', 1560, {
    badge: 'sale',
    originalPrice: 1900,
    description: 'Pre-painted 1/7 scale anime heroine, flowing hair sculpt, dynamic base with effect parts.',
  }),
  make(603, 'fantasy', 'Anime Swordmaiden Figure', 1690, {
    sizes: ['6"', '10"'],
    description: 'Sword-drawn anime figure mid-slash, cloth-flow sculpt, clear action-line base piece.',
  }),
  make(604, 'fantasy', 'Pocket Adventurer', 1420, {
    description: 'Tiny hand-painted adventurer figure, backpack and lantern, gaming-table scale.',
  }),
  make(605, 'fantasy', 'Questknight (Detailed)', 2280, {
    colors: ['Sunburst', 'Steel', 'Classic'],
    description: 'High-detail knight figure, engraved plate armour, cape and greatsword, diorama-grade paint.',
  }),
  make(606, 'fantasy', 'Moraine Giant Figure', 2650, {
    sizes: ['8"', '14"'],
    description: 'Boulder-bodied stone giant, moss-wash detailing, fists the size of the base it stands on.',
  }),
]

// Assign an on-theme figure photo to each product, cycling through its
// category's image list.
{
  const seen = {}
  for (const p of PRODUCTS) {
    if (p.image) continue
    const i = (seen[p.category] = seen[p.category] ?? 0)
    p.image = figureImage(p.category, i)
    seen[p.category] += 1
  }
}

export function localSearch(term) {
  const q = term.trim().toLowerCase()
  if (!q) return []
  return PRODUCTS.filter((p) =>
    [p.title, p.description, p.category].some((field) => field.toLowerCase().includes(q)),
  )
}

export function localByCategory(slug) {
  return PRODUCTS.filter((p) => p.category === slug)
}

export function localById(id) {
  return PRODUCTS.find((p) => p.id === String(id)) ?? null
}

export const DEMO_CREDENTIALS = { email: 'demo@figures.shop', password: 'figures123' }
