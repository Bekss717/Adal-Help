import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import CampaignPage from './pages/CampaignPage'
import CampaignDetailPage from './pages/CampaignDetailPage'
import AuthPage from './pages/AuthPage'
import StartFeesPage from './pages/StartFeesPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"            element={<HomePage />} />
          <Route path="/campaigns"   element={<CampaignPage />} />
          <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="/login"       element={<AuthPage mode="login" />} />
          <Route path="/register"    element={<AuthPage mode="register" />} />
          <Route path="/start-fees"  element={
            <ProtectedRoute roles={['organizer', 'admin']}>
              <StartFeesPage />
            </ProtectedRoute>
          } />
          <Route path="*"            element={<NotFoundPage />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  )
}