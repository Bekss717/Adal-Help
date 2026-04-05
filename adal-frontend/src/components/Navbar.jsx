import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../component-styles/Navbar.css'

const CATEGORIES = [
  { slug: 'medical',    label: 'Медицина',          emoji: '🏥' },
  { slug: 'children',   label: 'Дети',          emoji: '👶' },
  { slug: 'elderly',    label: 'Пожилые люди',    emoji: '👴' },
  { slug: 'pets',       label: 'Животные',              emoji: '🐾' },
  { slug: 'disability', label: 'Инвалидность',      emoji: '♿' },
  { slug: 'disaster',   label: 'Помощь при катастрофах',   emoji: '🆘' },
  { slug: 'education',  label: 'Образование',         emoji: '📚' },
  { slug: 'other',      label: 'Другое',             emoji: '💛' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled]       = useState(false)
  const [menuOpen, setMenuOpen]       = useState(false)
  const [catOpen, setCatOpen]         = useState(false)
  const [userOpen, setUserOpen]       = useState(false)
  const catRef  = useRef(null)
  const userRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (catRef.current  && !catRef.current.contains(e.target))  setCatOpen(false)
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // close mobile menu on route change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMenuOpen(false) }, [location])

  const handleLogout = () => {
    logout()
    setUserOpen(false)
    navigate('/')
  }

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link'

  return (
    <header className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-inner container">

        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">✦</span>
          <span className="logo-text">Adal<span>Help</span></span>
        </Link>

        {/* Desktop nav */}
        <nav className="navbar-links">
          <Link to="/" className={isActive('/')}>Главная</Link>
          <Link to="/campaigns" className={isActive('/campaigns')}>Сборы</Link>

          {/* Categories dropdown */}
          <div className="nav-dropdown" ref={catRef}>
            <button
              className={`nav-link dropdown-trigger${catOpen ? ' open' : ''}`}
              onClick={() => setCatOpen(v => !v)}
            >
              Категории
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            {catOpen && (
              <div className="dropdown-menu">
                {CATEGORIES.map(cat => (
                  <Link
                    key={cat.slug}
                    to={`/campaigns?category=${cat.slug}`}
                    className="dropdown-item"
                    onClick={() => setCatOpen(false)}
                  >
                    <span className="dropdown-emoji">{cat.emoji}</span>
                    {cat.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Desktop right side */}
        <div className="navbar-actions">
          {user ? (
            <>
              {(user.role === 'organizer' || user.role === 'admin') && (
                <Link to="/start-fees" className="btn btn-primary btn-sm">
                  + Начать сбор
                </Link>
              )}

              {/* User menu */}
              <div className="nav-dropdown" ref={userRef}>
                <button className="user-avatar-btn" onClick={() => setUserOpen(v => !v)}>
                  <div className="avatar">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {userOpen && (
                  <div className="dropdown-menu dropdown-right">
                    <div className="dropdown-header">
                      <p className="dropdown-name">{user.name}</p>
                      <p className="dropdown-email">{user.email}</p>
                    </div>
                    <div className="dropdown-divider"/>
                    <Link to="/profile" className="dropdown-item" onClick={() => setUserOpen(false)}>
                      Мой профиль
                    </Link>
                    {user.role === 'organizer' && (
                      <Link to="/my-campaigns" className="dropdown-item" onClick={() => setUserOpen(false)}>
                        Мои сборы
                      </Link>
                    )}
                    <div className="dropdown-divider"/>
                    <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Войти</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Присоединиться бесплатно</Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className={`hamburger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <span/><span/><span/>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-link">Главная</Link>
          <Link to="/campaigns" className="mobile-link">Все сборы</Link>
          <div className="mobile-divider"/>
          <p className="mobile-section-label">Категории</p>
          {CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              to={`/campaigns?category=${cat.slug}`}
              className="mobile-link"
            >
              {cat.emoji} {cat.label}
            </Link>
          ))}
          <div className="mobile-divider"/>
          {user ? (
            <>
              <Link to="/start-fees" className="mobile-link mobile-cta">+ Начать сбор</Link>
              <button className="mobile-link mobile-logout" onClick={handleLogout}>Выйти</button>
            </>
          ) : (
            <>
              <Link to="/login"    className="mobile-link">Войти</Link>
              <Link to="/register" className="mobile-link mobile-cta">Присоединиться бесплатно</Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}