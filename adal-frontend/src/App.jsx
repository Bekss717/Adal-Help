import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import CampaignsPage from './pages/CampaignsPage'
import CampaignDetailPage from './pages/CampaignDetailPage'
import AuthPage from './pages/AuthPage'
import StartFeesPage from './pages/StartFeesPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"              element={<HomePage />} />
          <Route path="/campaigns"     element={<CampaignsPage />} />
          <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="/login"         element={<AuthPage mode="login" />} />
          <Route path="/register"      element={<AuthPage mode="register" />} />

          {/* Profile — any logged-in user */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage defaultTab="profile" />
            </ProtectedRoute>
          } />

          {/* My campaigns tab — any logged-in user (organizers see their campaigns, donors see empty state) */}
          <Route path="/my-campaigns" element={
            <ProtectedRoute>
              <ProfilePage defaultTab="campaigns" />
            </ProtectedRoute>
          } />

          {/* Start campaign — organizer or admin only */}
          <Route path="/start-fees" element={
            <ProtectedRoute roles={['organizer', 'admin']}>
              <StartFeesPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  )
}