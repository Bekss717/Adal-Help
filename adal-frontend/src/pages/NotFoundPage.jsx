import { Link } from 'react-router-dom'
import '../page-styles/NotFoundPage.css'

export default function NotFoundPage() {
  return (
    <div className="notfound">
      <div className="notfound-inner">
        <div className="notfound-num">404</div>
        <h1 className="notfound-title">Страница не найдена</h1>
        <p className="notfound-desc">Страница, которую вы ищете, не существует или была перемещена.</p>
        <div className="notfound-actions">
          <Link to="/" className="btn btn-primary btn-lg">Главная</Link>
          <Link to="/campaigns" className="btn btn-secondary btn-lg">Просмотреть кампании</Link>
        </div>
      </div>
    </div>
  )
}