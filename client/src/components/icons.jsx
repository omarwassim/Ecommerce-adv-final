// Hand-authored inline SVG icons — no icon library, no sprite sheet.
// Every icon inherits `currentColor` and takes an optional `size`.

const base = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
})

export function SearchIcon({ size = 20 }) {
  return (
    <svg {...base(size)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function HomeIcon({ size = 20 }) {
  return (
    <svg {...base(size)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  )
}

export function UserIcon({ size = 20 }) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  )
}

export function HeartIcon({ size = 20 }) {
  return (
    <svg {...base(size)}>
      <path d="M12 20s-7-4.4-9.5-8.4C1 8.8 2.4 5.5 5.7 5.5c2 0 3.4 1.2 4.3 2.6.9-1.4 2.3-2.6 4.3-2.6 3.3 0 4.7 3.3 3.2 6.1C19 15.6 12 20 12 20Z" />
    </svg>
  )
}

export function BagIcon({ size = 20 }) {
  return (
    <svg {...base(size)}>
      <path d="M6 8h12l1 12H5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

export function ChevronIcon({ size = 18 }) {
  return (
    <svg {...base(size)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function ArrowLeftIcon({ size = 20 }) {
  return (
    <svg {...base(size)}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  )
}

export function ArrowRightIcon({ size = 20 }) {
  return (
    <svg {...base(size)}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

export function MenuIcon({ size = 22 }) {
  return (
    <svg {...base(size)}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}

export function CloseIcon({ size = 22 }) {
  return (
    <svg {...base(size)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function TrashIcon({ size = 18 }) {
  return (
    <svg {...base(size)}>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </svg>
  )
}

export function CheckIcon({ size = 20 }) {
  return (
    <svg {...base(size)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

// Small animated robot face for the AI-assistant FAB.
export function BotIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="bot-icon"
    >
      <path d="M12 3v3" className="bot-antenna" />
      <circle cx="12" cy="2.5" r="1" fill="currentColor" />
      <rect x="4" y="6" width="16" height="12" rx="3" />
      <circle cx="9" cy="12" r="1.3" fill="currentColor" className="bot-eye bot-eye--l" />
      <circle cx="15" cy="12" r="1.3" fill="currentColor" className="bot-eye bot-eye--r" />
      <path d="M9.5 15.5h5" className="bot-mouth" />
    </svg>
  )
}
