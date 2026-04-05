import { Link } from 'react-router-dom'
import '../component-styles/CampaignCard.css'

const CATEGORY_META = {
  medical:    { emoji: '🏥', label: 'Медицина' },
  children:   { emoji: '👶', label: 'Дети' },
  elderly:    { emoji: '👴', label: 'Пожилые' },
  pets:       { emoji: '🐾', label: 'Животные' },
  disability: { emoji: '♿', label: 'Инвалидность' },
  disaster:   { emoji: '🆘', label: 'Катастрофы' },
  education:  { emoji: '📚', label: 'Образование' },
  other:      { emoji: '💛', label: 'Другое' },
}

function formatKGS(amount) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M KGS`
  if (amount >= 1_000)     return `${(amount / 1_000).toFixed(0)}K KGS`
  return `${amount} KGS`
}

function daysLeft(deadline) {
  if (!deadline) return null
  const diff = new Date(deadline) - new Date()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days > 0 ? days : 0
}

export default function CampaignCard({ campaign }) {
  const cat      = CATEGORY_META[campaign.category] || CATEGORY_META.other
  const progress = Math.min(Math.round((campaign.raisedAmount / campaign.goalAmount) * 100), 100)
  const days     = daysLeft(campaign.deadline)

  return (
    <Link to={`/campaigns/${campaign._id}`} className="campaign-card">
      {/* Image / placeholder */}
      <div className="campaign-card-image">
        {campaign.images?.[0]
          ? <img src={campaign.images[0]} alt={campaign.title} />
          : <div className="campaign-card-placeholder">{cat.emoji}</div>
        }
        {campaign.isUrgent && <span className="urgent-badge">🔴 Срочная</span>}
        <span className="cat-chip">{cat.emoji} {cat.label}</span>
      </div>

      {/* Body */}
      <div className="campaign-card-body">
        <h3 className="campaign-card-title">{campaign.title}</h3>
        <p className="campaign-card-desc">
          {campaign.description?.slice(0, 100)}{campaign.description?.length > 100 ? '…' : ''}
        </p>

        {/* Progress */}
        <div className="campaign-card-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-meta">
            <span className="progress-raised">{formatKGS(campaign.raisedAmount)}</span>
            <span className="progress-pct">{progress}%</span>
          </div>
          <p className="progress-goal">из {formatKGS(campaign.goalAmount)} цели</p>
        </div>

        {/* Footer */}
        <div className="campaign-card-footer">
          <div className="campaign-meta-item">
            <span className="meta-icon">👥</span>
            <span>{campaign.donorCount || 0} доноры</span>
          </div>
          {days !== null && (
            <div className={`campaign-meta-item${days <= 3 ? ' urgent-days' : ''}`}>
              <span className="meta-icon">⏱</span>
              <span>{days === 0 ? 'Последний день!' : `${days}д осталось`}</span>
            </div>
          )}
          {campaign.organizer?.isVerified && (
            <span className="verified-chip">✓ Проверено</span>
          )}
        </div>
      </div>
    </Link>
  )
}