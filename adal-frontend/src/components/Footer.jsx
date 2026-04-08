import { Link } from 'react-router-dom'
import '../component-styles/Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span>✦</span> AdalHelp
          </Link>
          <p className="footer-desc">
            Прозрачная платформа благотворительности для Кыргызстана. Каждый сом отслеживается, каждая причина проверена.
          </p>
          <div className="footer-trust">
            <span className="trust-badge">🔒 Безопасно</span>
            <span className="trust-badge">✓ Проверенные кампании</span>
            <span className="trust-badge">📊 Прозрачно</span>
          </div>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>Платформа</h4>
            <Link to="/campaigns">Все сборы</Link>
            <Link to="/campaigns?urgent=true">Срочная помощь</Link>
            <Link to="/analytics">Аналитика</Link>
            <Link to="/start-fees">Начать сбор</Link>
          </div>
          <div className="footer-col">
            <h4>Категории</h4>
            <Link to="/campaigns?category=medical">Медицина</Link>
            <Link to="/campaigns?category=children">Дети</Link>
            <Link to="/campaigns?category=elderly">Пожилые люди</Link>
            <Link to="/campaigns?category=pets">Животные</Link>
            <Link to="/campaigns?category=disability">Инвалидность</Link>
          </div>
          <div className="footer-col">
            <h4>Аккаунт</h4>
            <Link to="/login">Войти</Link>
            <Link to="/register">Создать аккаунт</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>© {new Date().getFullYear()} AdalHelp. Создано для Кыргызстана</p>
        </div>
      </div>
    </footer>
  )
}