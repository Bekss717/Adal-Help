import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import CampaignCard from '../components/CampaignCard'
import '../page-styles/CampaignPage.css'

const CATEGORIES = [
  { slug: '',           label: 'Все',         emoji: '✦' },
  { slug: 'medical',    label: 'Медицина',     emoji: '🏥' },
  { slug: 'children',   label: 'Дети',    emoji: '👶' },
  { slug: 'elderly',    label: 'Пожилые',     emoji: '👴' },
  { slug: 'pets',       label: 'Животные',        emoji: '🐾' },
  { slug: 'disability', label: 'Инвалидность',emoji: '♿' },
  { slug: 'disaster',   label: 'Катастрофы',    emoji: '🆘' },
  { slug: 'education',  label: 'Образование',   emoji: '📚' },
  { slug: 'other',      label: 'Другое',       emoji: '💛' },
]

export default function CampaignsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [campaigns, setCampaigns] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState(searchParams.get('search') || '')
  const [inputVal,  setInputVal]  = useState(searchParams.get('search') || '')

  const category = searchParams.get('category') || ''
  const urgent   = searchParams.get('urgent') === 'true'

  const setCategory = (slug) => {
    const p = new URLSearchParams(searchParams)
    if (slug) p.set('category', slug); else p.delete('category')
    p.delete('urgent')
    setSearchParams(p)
  }

  const toggleUrgent = () => {
    const p = new URLSearchParams(searchParams)
    if (urgent) p.delete('urgent'); else p.set('urgent', 'true')
    setSearchParams(p)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    const params = { status: 'active' }
    if (category) params.category = category
    if (urgent)   params.urgent   = 'true'
    if (search)   params.search   = search

    api.get('/campaigns', { params })
      .then(res => setCampaigns(res.data.campaigns || []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false))
  }, [category, urgent, search])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(inputVal.trim())
    const p = new URLSearchParams(searchParams)
    if (inputVal.trim()) p.set('search', inputVal.trim()); else p.delete('search')
    setSearchParams(p)
  }

  return (
    <div className="campaigns-page">

      {/* Page header */}
      <div className="campaigns-header">
        <div className="container">
          <h1 className="campaigns-title">
            {urgent ? '🔴 Срочные кампании' : category
              ? `${CATEGORIES.find(c => c.slug === category)?.emoji} ${CATEGORIES.find(c => c.slug === category)?.label} Кампании`
              : 'Все кампании'}
          </h1>
          <p className="campaigns-subtitle"> Каждый сбор проверен. Каждый сом отслежен.</p>

          {/* Search */}
          <form className="campaigns-search" onSubmit={handleSearch}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Поиск кампаний…"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              className="search-input-inline"
            />
            {inputVal && (
              <button type="button" className="search-clear" onClick={() => { setInputVal(''); setSearch(''); }}>✕</button>
            )}
            <button type="submit" className="btn btn-primary btn-sm">Поиск</button>
          </form>
        </div>
      </div>

      <div className="container campaigns-body">

        {/* Category tabs */}
        <div className="cat-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat.slug}
              className={`cat-tab${category === cat.slug ? ' active' : ''}`}
              onClick={() => setCategory(cat.slug)}
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="filters-row">
          <p className="results-count">
            {loading ? 'Загрузка…' : `${campaigns.length} кампани${campaigns.length !== 1 ? 'й' : 'я'} найдено`}
          </p>
          <button
            className={`filter-chip${urgent ? ' active' : ''}`}
            onClick={toggleUrgent}
          >
            🔴 Только срочные
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="campaigns-loading">
            {[1,2,3,4,5,6].map(i => <div key={i} className="card-skeleton"/>)}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>Сборы не найдены</h3>
            <p>Попробуйте другую категорию или поисковый запрос.</p>
          </div>
        ) : (
          <div className="grid-3">
            {campaigns.map(c => <CampaignCard key={c._id} campaign={c}/>)}
          </div>
        )}
      </div>
    </div>
  )
}