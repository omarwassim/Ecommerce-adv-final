import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Redirects to /account (passing the attempted path in router state) when the
// user is signed out.
export default function ProtectedRoute({ children }) {
  const { isAuthed } = useAuth()
  const location = useLocation()

  if (!isAuthed) {
    return <Navigate to="/account" replace state={{ from: location.pathname + location.search }} />
  }
  return children
}
