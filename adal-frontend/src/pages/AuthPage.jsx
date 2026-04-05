import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../page-styles/AuthPage.css'

export default function AuthPage({ mode = 'login' }) {
  const { login, register } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/'

  const [tab,      setTab]      = useState(mode)
  const [loading,  setLoading]  = useState(false)
  const [errors,   setErrors]   = useState({})
  const [apiError, setApiError] = useState('')

  // Login form
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  // Register form
  const [regData, setRegData] = useState({ name: '', email: '', password: '', confirm: '', role: 'donor', phone: '' })

  const validateLogin = () => {
    const e = {}
    if (!loginData.email) e.email = 'Электронная почта обязательна'
    else if (!/\S+@\S+\.\S+/.test(loginData.email)) e.email = 'Неверный адрес электронной почты'
    if (!loginData.password) e.password = 'Пароль обязателен'
    return e
  }
  const validateRegister = () => {
    const e = {}
    if (!regData.name || regData.name.trim().length < 2) e.name = 'Имя должно быть не менее 2 символов'
    if (!regData.email) e.email = 'Электронная почта обязательна'
    else if (!/\S+@\S+\.\S+/.test(regData.email)) e.email = 'Неверный адрес электронной почты'
    if (!regData.password || regData.password.length < 6) e.password = 'Пароль должен быть не менее 6 символов'
    if (regData.password !== regData.confirm) e.confirm = 'Пароли не совпадают'
    return e
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const errs = validateLogin()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true); setApiError(''); setErrors({})
    try {
      const user = await login(loginData.email, loginData.password)
      navigate(user.role === 'organizer' ? '/start-fees' : from, { replace: true })
    } catch (err) {
      setApiError(err.response?.data?.message || 'Вход не удался. Пожалуйста, попробуйте еще раз.')
    } finally { setLoading(false) }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const errs = validateRegister()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true); setApiError(''); setErrors({})
    try {
      await register({ name: regData.name, email: regData.email, password: regData.password, role: regData.role, phone: regData.phone })
      navigate(regData.role === 'organizer' ? '/start-fees' : '/', { replace: true })
    } catch (err) {
      setApiError(err.response?.data?.message || 'Регистрация не удалась. Пожалуйста, попробуйте еще раз.')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <Link to="/" className="auth-logo">✦ AdalHelp</Link>
          <h2 className="auth-tagline">Прозрачная благотворительность<br/>для Кыргызстана</h2>
          <p className="auth-sub">Каждая сбор проверен. Каждый сом отслежен. Полная прозрачность гарантирована.</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature"><span>🔒</span><p>Безопасный эскроу — средства защищены до проверки</p></div>
          <div className="auth-feature"><span>✓</span><p>Каждый организатор и документ проверен</p></div>
          <div className="auth-feature"><span>🌍</span><p>Пожертвуйте в любой валюте, авто-конвертация в KGS</p></div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {/* Tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setErrors({}); setApiError('') }}>Войти</button>
            <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setErrors({}); setApiError('') }}>Создать аккаунт</button>
          </div>

          {apiError && (
            <div className="auth-error">⚠️ {apiError}</div>
          )}

          {/* LOGIN */}
          {tab === 'login' && (
            <form className="auth-form" onSubmit={handleLogin} noValidate>
              <div className="form-group">
                <label className="form-label">Адрес электронной почты</label>
                <input className={`form-input${errors.email ? ' error' : ''}`} type="email" placeholder="you@example.com"
                  value={loginData.email} onChange={e => setLoginData(p => ({...p, email: e.target.value}))} />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Пароль</label>
                <input className={`form-input${errors.password ? ' error' : ''}`} type="password" placeholder="••••••••"
                  value={loginData.password} onChange={e => setLoginData(p => ({...p, password: e.target.value}))} />
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>
              <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={loading}>
                {loading ? 'Вход…' : 'Войти'}
              </button>
              <p className="auth-switch">
                Нет аккаунта? <button type="button" className="auth-link" onClick={() => setTab('register')}>Создать бесплатно →</button>
              </p>
            </form>
          )}

          {/* REGISTER */}
          {tab === 'register' && (
            <form className="auth-form" onSubmit={handleRegister} noValidate>
              <div className="form-group">
                <label className="form-label">Полное имя</label>
                <input className={`form-input${errors.name ? ' error' : ''}`} type="text" placeholder="Бека Беков"
                  value={regData.name} onChange={e => setRegData(p => ({...p, name: e.target.value}))} />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Адрес электронной почты</label>
                <input className={`form-input${errors.email ? ' error' : ''}`} type="email" placeholder="you@example.com"
                  value={regData.email} onChange={e => setRegData(p => ({...p, email: e.target.value}))} />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Телефонный номер (необязательно)</label>
                <input className="form-input" type="tel" placeholder="+996 700 000 000"
                  value={regData.phone} onChange={e => setRegData(p => ({...p, phone: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Я хочу</label>
                <div className="role-options">
                  <label className={`role-option${regData.role === 'donor' ? ' active' : ''}`}>
                    <input type="radio" name="role" value="donor" checked={regData.role==='donor'} onChange={() => setRegData(p => ({...p, role:'donor'}))} />
                    <span className="role-icon">💚</span>
                    <span className="role-text"><strong>Пожертвовать</strong><small>Поддерживать сборы</small></span>
                  </label>
                  <label className={`role-option${regData.role === 'organizer' ? ' active' : ''}`}>
                    <input type="radio" name="role" value="organizer" checked={regData.role==='organizer'} onChange={() => setRegData(p => ({...p, role:'organizer'}))} />
                    <span className="role-icon">📋</span>
                    <span className="role-text"><strong>Сбор средств (фандрайзинг)</strong><small>Начать кампанию</small></span>
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Пароль</label>
                <input className={`form-input${errors.password ? ' error' : ''}`} type="password" placeholder="Не менее 6 символов"
                  value={regData.password} onChange={e => setRegData(p => ({...p, password: e.target.value}))} />
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Подтвердить пароль</label>
                <input className={`form-input${errors.confirm ? ' error' : ''}`} type="password" placeholder="Повторите ваш пароль"
                  value={regData.confirm} onChange={e => setRegData(p => ({...p, confirm: e.target.value}))} />
                {errors.confirm && <span className="form-error">{errors.confirm}</span>}
              </div>
              <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={loading}>
                {loading ? 'Создание аккаунта…' : 'Создать бесплатный аккаунт'}
              </button>
              <p className="auth-switch">
                Уже есть аккаунт? <button type="button" className="auth-link" onClick={() => setTab('login')}>Войти →</button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}