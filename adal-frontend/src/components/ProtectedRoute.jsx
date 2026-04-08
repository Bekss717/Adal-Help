import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Still checking token — show spinner, never redirect yet
  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner"/>
      </div>
    )
  }

  // Token check done, no user — redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Logged in but wrong role — go home, not 404
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}