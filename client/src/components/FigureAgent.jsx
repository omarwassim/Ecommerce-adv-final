import { Link, useLocation } from 'react-router-dom'
import { BotIcon } from './icons.jsx'
import './FigureAgent.css'

export default function FigureAgent() {
  const location = useLocation()
  if (location.pathname === '/assistant') return null

  return (
    <Link to="/assistant" className="figure-agent" aria-label="Ask Jarvis, the figure finder">
      <span className="figure-agent__icon">
        <BotIcon size={26} />
      </span>
      <span className="figure-agent__label">Ask Jarvis</span>
    </Link>
  )
}
