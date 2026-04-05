import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import '../page-styles/ProfilePage.css'

export default function ProfilePage() {
  const { user } = useAuth()
  const [tab,       setTab]      = useState('profile')
  const [campaigns, setCampaigns] = useState([])
  const [donations, setDonations] = useState([])
  const [loading,   setLoading]  = useState(false)
  const [saving,    setSaving]   = useState(false)
  const [toast,     setToast]    = useState(null)
  const [form,      setForm]     = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [docFile,   setDocFile]  = useState(null)
  const [uploading, setUploading] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    if (tab === 'campaigns' && user?.role === 'organizer') {
      setLoading(true)
      api.get('/campaigns', { params: { status: 'all' } })
        .then(res => {
          const mine = (res.data.campaigns || []).filter(c => c.organizer?._id === user._id || c.organizer === user._id)
          setCampaigns(mine)
        })
        .finally(() => setLoading(false))
    }
    if (tab === 'donations') {
      setLoading(true)
      api.get('/transactions/my')
        .then(res => setDonations(res.data.transactions || []))
        .finally(() => setLoading(false))
    }
  }, [tab, user])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/auth/profile', form)
      showToast('Профиль обновлен успешно.')
    } catch (err) {
      showToast(err.response?.data?.message || 'Обновление не удалось.', 'error')
    } finally { setSaving(false) }
  }

  const handleDocUpload = async () => {
    if (!docFile) return
    setUploading(true)
    const fd = new FormData()
    fd.append('document', docFile)
    try {
      await api.post('/auth/upload-document', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      showToast('Документ загружен успешно.')
      setDocFile(null)
    } catch (err) {
      showToast(err.response?.data?.message || 'Загрузка не удалась.', 'error')
    } finally { setUploading(false) }
  }

  if (!user) return null

  return (
    <div className="profile-page">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <span className="toast-icon">{toast.type === 'success' ? '✅' : '❌'}</span>
            {toast.msg}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="profile-header">
        <div className="container profile-header-inner">
          <div className="profile-avatar-lg">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{user.name}</h1>
            <p className="profile-email">{user.email}</p>
            <div className="profile-badges">
              <span className="badge badge-navy">{user.role}</span>
              {user.isVerified
                ? <span className="badge badge-green">✓ Verified</span>
                : <span className="badge badge-gold">⏳ Pending verification</span>
              }
              <span className="badge badge-navy">Trust: {user.trustScore}/100</span>
            </div>
          </div>
          {user.role === 'organizer' && (
            <Link to="/start-fees" className="btn btn-primary" style={{ marginLeft: 'auto' }}>
              + Новая кампания
            </Link>
          )}
        </div>
      </div>

      <div className="container profile-body">
        {/* Tabs */}
        <div className="profile-tabs">
          <button className={`profile-tab${tab === 'profile' ? ' active' : ''}`} onClick={() => setTab('profile')}>Мой профиль</button>
          {user.role === 'organizer' && (
            <button className={`profile-tab${tab === 'campaigns' ? ' active' : ''}`} onClick={() => setTab('campaigns')}>Мои кампании</button>
          )}
          <button className={`profile-tab${tab === 'donations' ? ' active' : ''}`} onClick={() => setTab('donations')}>Мои пожертвования</button>
          <button className={`profile-tab${tab === 'documents' ? ' active' : ''}`} onClick={() => setTab('documents')}>Документы</button>
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <div className="profile-section">
            <div className="profile-card">
              <h3 className="profile-card-title">Личная информация</h3>
              <form onSubmit={handleSave} className="profile-form">
                <div className="form-group">
                  <label className="form-label">Полное имя</label>
                  <input className="form-input" type="text" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Адрес электронной почты</label>
                  <input className="form-input" type="email" value={user.email} disabled style={{ opacity: 0.6 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Электронная почта не может быть изменена</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Номер телефона</label>
                  <input className="form-input" type="tel" placeholder="+996 700 000 000" value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Сохранение…' : 'Сохранить изменения'}
                </button>
              </form>
            </div>

            {/* Account stats */}
            <div className="profile-stats">
              <div className="pstat">
                <span className="pstat-icon">📅</span>
                <div>
                  <p className="pstat-val">{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                  <p className="pstat-lbl">Участник с</p>
                </div>
              </div>
              <div className="pstat">
                <span className="pstat-icon">🛡</span>
                <div>
                  <p className="pstat-val">{user.trustScore}/100</p>
                  <p className="pstat-lbl">Рейтинг доверия</p>
                </div>
              </div>
              <div className="pstat">
                <span className="pstat-icon">{user.isVerified ? '✅' : '⏳'}</span>
                <div>
                  <p className="pstat-val">{user.isVerified ? 'Проверен' : 'Не проверен'}</p>
                  <p className="pstat-lbl">Статус аккаунта</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns tab */}
        {tab === 'campaigns' && user.role === 'organizer' && (
          <div className="profile-section">
            {loading ? (
              <div className="page-loader"><div className="spinner"/></div>
            ) : campaigns.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>Кампаний пока нет</h3>
                <p>Начните свою первую кампанию, чтобы сделать разницу.</p>
                <Link to="/start-fees" className="btn btn-primary" style={{ marginTop: 16 }}>+ Создать кампанию</Link>
              </div>
            ) : (
              <div className="campaigns-list">
                {campaigns.map(c => (
                  <div key={c._id} className="campaign-row">
                    <div className="campaign-row-info">
                      <Link to={`/campaigns/${c._id}`} className="campaign-row-title">{c.title}</Link>
                      <div className="campaign-row-meta">
                        <span className={`badge badge-${c.status === 'active' ? 'green' : c.status === 'pending' ? 'gold' : 'navy'}`}>{c.status}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.category}</span>
                      </div>
                    </div>
                    <div className="campaign-row-progress">
                      <div className="progress-bar" style={{ width: 120 }}>
                        <div className="progress-fill" style={{ width: `${Math.min(Math.round((c.raisedAmount/c.goalAmount)*100),100)}%` }}/>
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--green-dark)', fontWeight: 700 }}>
                        {c.raisedAmount?.toLocaleString()} / {c.goalAmount?.toLocaleString()} KGS
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Donations tab */}
        {tab === 'donations' && (
          <div className="profile-section">
            {loading ? (
              <div className="page-loader"><div className="spinner"/></div>
            ) : donations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💚</div>
                <h3>Пожертвований пока нет</h3>
                <p>Просмотрите кампании и сделайте свое первое пожертвование.</p>
                <Link to="/campaigns" className="btn btn-primary" style={{ marginTop: 16 }}>Просмотреть кампании</Link>
              </div>
            ) : (
              <div className="donations-history">
                {donations.map(d => (
                  <div key={d._id} className="donation-row">
                    <div className="donation-row-icon">💚</div>
                    <div className="donation-row-info">
                      <Link to={`/campaigns/${d.campaign?._id}`} className="donation-row-title">
                        {d.campaign?.title || 'Campaign'}
                      </Link>
                      <p className="donation-row-date">{new Date(d.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="donation-row-amount">
                      <p className="donation-row-kgs">{d.amount?.toLocaleString()} KGS</p>
                      {d.originalCurrency !== 'KGS' && (
                        <p className="donation-row-orig">{d.originalAmount} {d.originalCurrency}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Documents tab */}
        {tab === 'documents' && (
          <div className="profile-section">
            <div className="profile-card">
              <h3 className="profile-card-title">Документы верификации</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
                Загрузите ID или другие документы, чтобы ваш аккаунт был проверен. Проверенные аккаунты могут создавать кампании.
              </p>

              {/* Upload area */}
              <div className="doc-upload-area">
                <label className="upload-box-sm" htmlFor="doc-upload">
                  <span style={{ fontSize: 28 }}>📎</span>
                  <p style={{ fontWeight: 600, color: 'var(--navy)', marginTop: 8 }}>
                    {docFile ? docFile.name : 'Выбрать документ'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF, JPG, PNG, DOC — макс 10МБ</p>
                  <input id="doc-upload" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }}
                    onChange={e => setDocFile(e.target.files[0])} />
                </label>
                {docFile && (
                  <button className="btn btn-primary" onClick={handleDocUpload} disabled={uploading}>
                    {uploading ? 'Загрузка…' : '⬆ Загрузить документ'}
                  </button>
                )}
              </div>

              {/* Existing documents */}
              {user.documents?.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Загруженные документы
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {user.documents.map((doc, i) => (
                      <div key={i} className="file-item">
                        <span>📄</span>
                        <span className="file-name">{doc.originalName}</span>
                        <span className="file-size">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        <a href={doc.path} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Просмотр</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}