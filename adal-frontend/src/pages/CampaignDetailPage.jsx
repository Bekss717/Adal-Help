import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import DonateModal from '../components/DonateModal'
import '../page-styles/CampaignDetailPage.css'

export default function CampaignDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [campaign,    setCampaign]    = useState(null)
  const [donations,   setDonations]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showDonate,  setShowDonate]  = useState(false)
  const [toast,       setToast]       = useState(null)

  useEffect(() => {
    api.get(`/campaigns/${id}`)
      .then(res => {
        setCampaign(res.data.campaign)
        setDonations(res.data.recentDonations || [])
      })
      .catch(() => navigate('/campaigns'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleDonateSuccess = (data) => {
    showToast(`✅ ${data.message}`)
    api.get(`/campaigns/${id}`).then(res => {
      setCampaign(res.data.campaign)
      setDonations(res.data.recentDonations || [])
    })
  }

  if (loading) return <div className="page-loader" style={{ paddingTop: 120 }}><div className="spinner"/></div>
  if (!campaign) return null

  const progress = Math.min(Math.round((campaign.raisedAmount / campaign.goalAmount) * 100), 100)
  const daysLeft = campaign.deadline
    ? Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / 86400000))
    : null

  return (
    <div className="detail-page">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <span className="toast-icon">{toast.type === 'success' ? '✅' : '❌'}</span>
            {toast.msg}
          </div>
        </div>
      )}

      <div className="container detail-layout">

        {/* LEFT */}
        <div className="detail-main">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <Link to="/campaigns">Кампании</Link>
            <span>›</span>
            <span>{campaign.category}</span>
          </div>

          {/* Image */}
          <div className="detail-image">
            {campaign.images?.[0]
              ? <img src={campaign.images[0]} alt={campaign.title}/>
              : <div className="detail-placeholder">
                  {campaign.category === 'medical' ? '🏥' : campaign.category === 'children' ? '👶' : campaign.category === 'elderly' ? '👴' : campaign.category === 'pets' ? '🐾' : '💛'}
                </div>
            }
            {campaign.isUrgent && <span className="detail-urgent">🔴 СРОЧНО</span>}
          </div>

          {/* Title + badges */}
          <div className="detail-title-row">
            <div>
              <h1 className="detail-title">{campaign.title}</h1>
              <div className="detail-badges">
                <span className="badge badge-green">{campaign.category}</span>
                <span className={`badge ${campaign.status === 'active' ? 'badge-green' : 'badge-navy'}`}>
                  {campaign.status}
                </span>
                {campaign.organizer?.isVerified && <span className="badge badge-gold">✓ Проверенный организатор</span>}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="detail-description">
            <h3>Об этой кампании</h3>
            <p>{campaign.description}</p>
          </div>

          {/* Organizer */}
          <div className="detail-organizer">
            <div className="org-avatar">{campaign.organizer?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <p className="org-label">Кампания от</p>
              <p className="org-name">
                {campaign.organizer?.name}
                {campaign.organizer?.isVerified && <span className="org-verified">✓</span>}
              </p>
              <p className="org-trust">Рейтинг доверия: {campaign.organizer?.trustScore}/100</p>
            </div>
          </div>

          {/* Recent donations */}
          {donations.length > 0 && (
            <div className="detail-donations">
              <h3>Недавние пожертвования</h3>
              <div className="donations-list">
                {donations.map(d => (
                  <div key={d._id} className="donation-item">
                    <div className="donation-avatar">
                      {d.isAnonymous ? '🕶' : d.donor?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="donation-info">
                      <p className="donation-name">
                        {d.isAnonymous ? 'Анонимно' : d.donorName || 'Донор'}
                      </p>
                      {d.message && <p className="donation-msg">"{d.message}"</p>}
                    </div>
                    <div className="donation-amount">
                      <p className="donation-kgs">{d.amount?.toLocaleString()} KGS</p>
                      {d.originalCurrency !== 'KGS' && (
                        <p className="donation-orig">{d.originalAmount} {d.originalCurrency}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — sticky sidebar */}
        <div className="detail-sidebar">
          <div className="sidebar-card">
            {/* Raised */}
            <div className="sidebar-raised">
              <span className="raised-amount">{campaign.raisedAmount?.toLocaleString()} KGS</span>
              <span className="raised-goal">собрано из {campaign.goalAmount?.toLocaleString()} KGS цели</span>
            </div>

            {/* Progress */}
            <div className="progress-bar" style={{ height: 8, margin: '16px 0 8px' }}>
              <div className="progress-fill" style={{ width: `${progress}%` }}/>
            </div>
            <p className="sidebar-pct">{progress}% профинансировано</p>

            {/* Meta */}
            <div className="sidebar-meta">
              <div className="sidebar-meta-item">
                <span className="meta-val">{campaign.donorCount || 0}</span>
                <span className="meta-lbl">Доноры</span>
              </div>
              {daysLeft !== null && (
                <div className="sidebar-meta-item">
                  <span className={`meta-val${daysLeft <= 3 ? ' urgent' : ''}`}>
                    {daysLeft === 0 ? 'Сегодня!' : `${daysLeft}д`}
                  </span>
                  <span className="meta-lbl">Дней осталось</span>
                </div>
              )}
              <div className="sidebar-meta-item">
                <span className="meta-val">{progress}%</span>
                <span className="meta-lbl">Завершено</span>
              </div>
            </div>

            {/* Donate button */}
            {campaign.status === 'active' ? (
              user ? (
                <button className="btn btn-primary btn-lg sidebar-donate" onClick={() => setShowDonate(true)}>
                  💚 Пожертвовать сейчас
                </button>
              ) : (
                <Link to="/login" className="btn btn-primary btn-lg sidebar-donate">
                  Войти, чтобы пожертвовать
                </Link>
              )
            ) : (
              <div className="sidebar-closed">
                Кампания {campaign.status}
              </div>
            )}

            {/* Location */}
            {campaign.location && (
              <p className="sidebar-location">📍 {campaign.location}</p>
            )}
          </div>

          {/* Trust box */}
          <div className="trust-box">
            <h4>🔒 Ваше пожертвование в безопасности</h4>
            <ul>
              <li>Документы проверены AdalHelp</li>
              <li>Средства удерживаются в эскроу</li>
              <li>Полная история транзакций публична</li>
            </ul>
          </div>
        </div>
      </div>

      {showDonate && (
        <DonateModal
          campaign={campaign}
          onClose={() => setShowDonate(false)}
          onSuccess={handleDonateSuccess}
        />
      )}
    </div>
  )
}