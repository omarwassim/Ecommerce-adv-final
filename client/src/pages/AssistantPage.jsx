import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminData } from '../context/AdminDataContext.jsx'
import { localSearch } from '../data/catalog.js'
import { DUMMY_ASSISTANT_REPLIES } from '../data/dummy.js'
import { formatPrice } from '../lib/format.js'
import { BotIcon } from '../components/icons.jsx'
import './AssistantPage.css'

// The API has no /ai/search endpoint. This is a local demo responder: it does a
// keyword + budget match against the in-memory catalogue and returns a canned
// reply. The chat UI is otherwise identical to the wired version.

const WELCOME = { role: 'agent', text: DUMMY_ASSISTANT_REPLIES.greeting }

export default function AssistantPage() {
  const { products } = useAdminData()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState([WELCOME])
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  function findMatches(query) {
    const q = query.toLowerCase()
    const pool = products.length ? products : []
    let hits = pool.filter((p) =>
      [p.title, p.description, p.category].some((f) => f.toLowerCase().includes(q)),
    )
    if (hits.length === 0) hits = localSearch(query)

    const budget = query.match(/(?:under|below|less than)\s*(\d{3,6})/i)
    if (budget) {
      const cap = Number(budget[1])
      hits = (hits.length ? hits : pool).filter((p) => p.price <= cap)
    }
    return hits.slice(0, 4)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const query = input.trim()
    if (!query || busy) return

    setMessages((m) => [...m, { role: 'you', text: query }])
    setInput('')
    setBusy(true)

    // Simulate a short "thinking" beat so the busy state is visible.
    await new Promise((r) => setTimeout(r, 550))

    const hits = findMatches(query)
    const reply = hits.length
      ? {
          role: 'agent',
          text: DUMMY_ASSISTANT_REPLIES.match(hits.length, query),
          products: hits,
          provider: 'demo',
        }
      : { role: 'agent', text: DUMMY_ASSISTANT_REPLIES.nomatch, provider: 'demo' }

    setMessages((m) => [...m, reply])
    setBusy(false)
  }

  return (
    <div className="assistant page">
      <header className="assistant__head">
        <span className="assistant__avatar">
          <BotIcon size={22} />
        </span>
        <div>
          <h1>Ask Jarvis</h1>
          <p>Figure finder · demo mode</p>
        </div>
      </header>

      <div className="assistant__thread">
        {messages.map((msg, i) => (
          <div key={i} className={`assistant__msg assistant__msg--${msg.role}`}>
            <p className="assistant__bubble">{msg.text}</p>
            {msg.products?.length > 0 && (
              <div className="assistant__results">
                {msg.products.map((p) => (
                  <Link key={p.id} to={`/product/${p.id}`} className="assistant__result">
                    <img src={p.image} alt={p.title} />
                    <span className="assistant__result-title">{p.title}</span>
                    <span className="assistant__result-price">{formatPrice(p.price)}</span>
                  </Link>
                ))}
              </div>
            )}
            {msg.provider && <span className="assistant__provider">via {msg.provider}</span>}
          </div>
        ))}
        {busy && (
          <div className="assistant__msg assistant__msg--agent">
            <p className="assistant__bubble assistant__bubble--busy">Looking through the catalog…</p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="assistant__form" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. a grey mecha under 3000"
          aria-label="Ask the figure finder"
        />
        <button type="submit" className="btn" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}
