import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import CampaignCard from '../components/CampaignCard'
import '../page-styles/HomePage.css'

const CATEGORIES = [
  { slug: 'medical',    label: 'Медицина',        emoji: '🏥', desc: 'Хирургия, лечение, медицина' },
  { slug: 'children',   label: 'Дети',       emoji: '👶', desc: 'Помощь нуждающимся детям' },
  { slug: 'elderly',    label: 'Пожилые',        emoji: '👴', desc: 'Уход за пожилыми гражданами' },
  { slug: 'pets',       label: 'Животные',           emoji: '🐾', desc: 'Животные, нуждающиеся в помощи' },
  { slug: 'disability', label: 'Инвалидность',   emoji: '♿', desc: 'Поддержка инвалидов' },
  { slug: 'disaster',   label: 'Катастрофы',       emoji: '🆘', desc: 'Чрезвычайная помощь' },
  { slug: 'education',  label: 'Образование',      emoji: '📚', desc: 'Знания для всех' },
  { slug: 'other',      label: 'Другое',          emoji: '💛', desc: 'Другие причины' },
]

const HOW_STEPS = [
  { num: '01', title: 'Организатор подает заявку', desc: 'Они подают свой сбор с проверенными документами — медицинские отчеты, удостоверения личности, квитанции.' },
  { num: '02', title: 'Мы проверяем все', desc: 'Наша команда проверяет каждый документ перед запуском сбора. Без исключений.' },
  { num: '03', title: 'Вы жертвуете безопасно', desc: 'Средства поступают в эскроу. Ни один сом не выпускается без доказательства использования.' },
  { num: '04', title: 'Прозрачная отчетность', desc: 'Отслеживайте каждую транзакцию в реальном времени. Видите точно, куда идут деньги.' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [stats,    setStats]    = useState(null)
  const [urgent,   setUrgent]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const revealRefs = useRef([])

  useEffect(() => {
    Promise.all([
      api.get('/campaigns/stats').catch(() => ({ data: { stats: {} } })),
      api.get('/campaigns/urgent').catch(() => ({ data: { campaigns: [] } })),
    ]).then(([s, u]) => {
      setStats(s.data.stats)
      setUrgent(u.data.campaigns || [])
    }).finally(() => setLoading(false))
  }, [])

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.12 }
    )
    revealRefs.current.forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [loading])

  const addReveal = (el) => { if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el) }

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/campaigns?search=${encodeURIComponent(search.trim())}`)
  }

  return (
    <div className="home">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-blob blob-1"/>
          <div className="hero-blob blob-2"/>
          <div className="hero-blob blob-3"/>
        </div>
        <div className="container hero-content">
          <div className="hero-badge">🇰🇬 Создано для Кыргызстана</div>
          <h1 className="hero-title">
            Благотворительность, которой можно <br/>
            <span className="hero-highlight">действительно доверять</span>
          </h1>
          <p className="hero-subtitle">
            AdalHelp проверяет каждый сбор, отслеживает каждый сом и обеспечивает, что средства доходят до тех, кто действительно нуждается — с полной прозрачностью.
          </p>

          <form className="hero-search" onSubmit={handleSearch}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Поиск кампаний, причин, людей…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary">Поиск</button>
          </form>

          <div className="hero-actions">
            <Link to="/campaigns" className="btn btn-primary btn-lg">Просмотреть сборы</Link>
            <Link to="/register?role=organizer" className="btn btn-secondary btn-lg">Начать сбор</Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-hint">
          <span/>
          <p>Прокрутите, чтобы исследовать</p>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────── */}
      {stats && (
        <section className="stats-bar">
          <div className="container stats-grid">
            <div className="stat-item">
              <span className="stat-num">{stats.activeCampaigns || 0}</span>
              <span className="stat-label">Активные сборы</span>
            </div>
            <div className="stat-divider"/>
            <div className="stat-item">
              <span className="stat-num">{stats.totalDonors || 0}</span>
              <span className="stat-label">Доноры</span>
            </div>
            <div className="stat-divider"/>
            <div className="stat-item">
              <span className="stat-num">
                {stats.totalRaisedKGS >= 1_000_000
                  ? `${(stats.totalRaisedKGS / 1_000_000).toFixed(1)}M`
                  : `${Math.round((stats.totalRaisedKGS || 0) / 1000)}K`}
              </span>
              <span className="stat-label">Собрано KGS</span>
            </div>
            <div className="stat-divider"/>
            <div className="stat-item">
              <span className="stat-num">{stats.completedCampaigns || 0}</span>
              <span className="stat-label">Измененных жизней</span>
            </div>
          </div>
        </section>
      )}

      {/* ── URGENT ───────────────────────────────────────── */}
      {urgent.length > 0 && (
        <section className="section urgent-section">
          <div className="container">
            <div className="section-header" ref={addReveal}>
              <div className="reveal" ref={addReveal}>
                <p className="section-label">🔴 Нужна помощь сейчас</p>
                <h2 className="section-title">Срочные сборы</h2>
                <p className="section-desc">Эти сборы нуждаются в вашей поддержке немедленно.</p>
              </div>
              <Link to="/campaigns?urgent=true" className="btn btn-secondary">Посмотреть все →</Link>
            </div>
            <div className="grid-3 reveal" ref={addReveal}>
              {urgent.slice(0, 3).map(c => <CampaignCard key={c._id} campaign={c}/>)}
            </div>
          </div>
        </section>
      )}

      {/* ── ABOUT ────────────────────────────────────────── */}
      <section className="section about-section">
        <div className="container about-inner">
          <div className="about-text reveal" ref={addReveal}>
            <p className="section-label">О AdalHelp</p>
            <h2 className="section-title">Почему Кыргызстану нужен лучший способ дарить</h2>
            <p className="about-desc">
              Сегодня большинство благотворительных пожертвований в Кыргызстане происходит через личные банковские карты, посты в Instagram и группы Telegram. Нет проверки, нет отслеживания и нет подотчетности.
            </p>
            <p className="about-desc">
              Мошенники эксплуатируют щедрость. Реальные кампании не могут завоевать доверие. Доноры перестают давать — не потому, что не заботятся, а потому, что были обмануты.
            </p>
            <p className="about-desc">
              <strong>AdalHelp меняет это.</strong> Каждый сбор документирован, каждый организатор проверен, и каждая транзакция видна обществу.
            </p>
            <div className="about-actions">
              <Link to="/register" className="btn btn-primary">Создать бесплатный аккаунт</Link>
              <Link to="/campaigns" className="btn btn-ghost">Посмотреть, как это работает →</Link>
            </div>
          </div>
          <div className="about-visual reveal" ref={addReveal}>
            <div className="about-card">
              <div className="about-card-icon">🔒</div>
              <h4>Защита через эскроу</h4>
              <p>Средства удерживаются безопасно до тех пор, пока счета и квитанции не будут проверены нашей командой.</p>
            </div>
            <div className="about-card about-card-offset">
              <div className="about-card-icon">📋</div>
              <h4>Проверка документов</h4>
              <p>Медицинские сертификаты, удостоверения личности и квитанции проверяются перед запуском любого сбора.</p>
            </div>
            <div className="about-card">
              <div className="about-card-icon">🌍</div>
              <h4>Глобальные пожертвования</h4>
              <p>Пожертвуйте в любой валюте — USD, EUR, RUB, KZT и другие. Мы автоматически конвертируем в KGS.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="section how-section">
        <div className="container">
          <div className="section-center reveal" ref={addReveal}>
            <p className="section-label">Простой процесс</p>
            <h2 className="section-title">Как работает AdalHelp</h2>
          </div>
          <div className="how-steps">
            {HOW_STEPS.map((step, i) => (
              <div key={i} className="how-step reveal" ref={addReveal} style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="how-num">{step.num}</div>
                <div className="how-content">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
                {i < HOW_STEPS.length - 1 && <div className="how-connector"/>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────── */}
      <section className="section categories-section">
        <div className="container">
          <div className="reveal" ref={addReveal}>
            <p className="section-label">Просмотреть по причине</p>
            <h2 className="section-title">Найдите сборы, которые важны для вас</h2>
          </div>
          <div className="categories-grid reveal" ref={addReveal}>
            {CATEGORIES.map(cat => (
              <Link key={cat.slug} to={`/campaigns?category=${cat.slug}`} className="category-tile">
                <span className="cat-emoji">{cat.emoji}</span>
                <h4 className="cat-name">{cat.label}</h4>
                <p className="cat-desc">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────── */}
      <section className="cta-section">
        <div className="container cta-inner reveal" ref={addReveal}>
          <div>
            <h2 className="cta-title">Готовы сделать разницу?</h2>
            <p className="cta-desc">Присоединяйтесь к тысячам кыргызстанцев, которые дарят с уверенностью.</p>
          </div>
          <div className="cta-actions">
            <Link to="/campaigns" className="btn btn-primary btn-lg" style={{ background: '#fff', color: 'var(--green-dark)' }}>
              Пожертвовать сейчас
            </Link>
            <Link to="/start-fees" className="btn btn-lg" style={{ border: '2px solid rgba(255,255,255,0.4)', color: '#fff' }}>
              Начать кампанию
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}