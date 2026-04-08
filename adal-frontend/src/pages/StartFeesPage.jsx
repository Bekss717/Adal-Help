import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import '../page-styles/StartFeesPage.css'

const CATEGORIES = [
  { slug: 'medical',    label: 'Медицина',       emoji: '🏥' },
  { slug: 'children',   label: 'Дети',           emoji: '👶' },
  { slug: 'elderly',    label: 'Пожилые',       emoji: '👴' },
  { slug: 'pets',       label: 'Питомцы',          emoji: '🐾' },
  { slug: 'disability', label: 'Инвалидность',  emoji: '♿' },
  { slug: 'disaster',   label: 'Катастрофы',emoji: '🆘' },
  { slug: 'education',  label: 'Образование',     emoji: '📚' },
  { slug: 'other',      label: 'Другие',         emoji: '💛' },
]

const STEPS = ['Информация о сбре', 'Цель и подробности', 'Документы', 'Обзор']

export default function StartFeesPage() {
  const navigate = useNavigate()
  const [step,       setStep]      = useState(0)
  const [loading,    setLoading]   = useState(false)
  const [errors,     setErrors]    = useState({})
  const [apiError,   setApiError]  = useState('')
  const [success,    setSuccess]   = useState(false)

  const [form, setForm] = useState({
    title:       '',
    description: '',
    category:    '',
    goalAmount:  '',
    deadline:    '',
    location:    '',
    isUrgent:    false,
  })
  const [documents, setDocuments] = useState([])
  const [images,    setImages]    = useState([])

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const validateStep = (s) => {
    const e = {}
    if (s === 0) {
      if (!form.title || form.title.trim().length < 5) e.title = 'Заголовок должен содержать не менее 5 символов'
      if (!form.description || form.description.trim().length < 20) e.description = 'Описание должно содержать не менее 20 символов'
      if (!form.category) e.category = 'Пожалуйста, выберите категорию'
    }
    if (s === 1) {
      if (!form.goalAmount || isNaN(form.goalAmount) || Number(form.goalAmount) < 1000) e.goalAmount = 'Минимальная цель - 1,000 KGS'
    }
    return e
  }

  const nextStep = () => {
    const e = validateStep(step)
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setLoading(true); setApiError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      documents.forEach(f => fd.append('documents', f))
      images.forEach(f => fd.append('images', f))

      const res = await api.post('/campaigns', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSuccess(true)
      // Go to the new campaign's detail page after 2 seconds
      const campaignId = res.data.campaign?._id
      setTimeout(() => {
        if (campaignId) {
          navigate(`/campaigns/${campaignId}`)
        } else {
          navigate('/campaigns')
        }
      }, 2000)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Отправка не удалась. Пожалуйста, попробуйте еще раз.')
      setStep(0)
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="start-success">
      <div className="success-icon">🎉</div>
      <h2>Сбор запущен!</h2>
      <p>Ваш сбор создан и теперь виден всем.</p>
      <p className="success-redirect">Мы поможем вам подготовиться к вашему предвыборному сбору…</p>
    </div>
  )

  return (
    <div className="start-page">
      <div className="container start-inner">

        {/* Header */}
        <div className="start-header">
          <h1 className="start-title">Начать сбор</h1>
          <p className="start-subtitle">Заполните поля ниже. Наша команда проверит ваши документы перед публикацией.</p>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {STEPS.map((s, i) => (
            <div key={i} className={`stepper-step${i <= step ? ' done' : ''}${i === step ? ' active' : ''}`}>
              <div className="stepper-num">{i < step ? '✓' : i + 1}</div>
              <span className="stepper-label">{s}</span>
              {i < STEPS.length - 1 && <div className="stepper-line"/>}
            </div>
          ))}
        </div>

        <div className="start-card">
          {apiError && <div className="auth-error" style={{ marginBottom: 20 }}>⚠️ {apiError}</div>}

          {/* STEP 0: Campaign Info */}
          {step === 0 && (
            <div className="step-content">
              <h3 className="step-title">Расскажите нам о вашем сборе</h3>

              <div className="form-group">
                <label className="form-label">Название сбора *</label>
                <input className={`form-input${errors.title ? ' error' : ''}`} type="text"
                  placeholder="Например, операция на сердце для 7-летнего Асана."
                  value={form.title} onChange={e => set('title', e.target.value)} />
                {errors.title && <span className="form-error">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Описание *</label>
                <textarea className={`form-input form-textarea${errors.description ? ' error' : ''}`}
                  placeholder="Подробно опишите ситуацию. Какая помощь необходима? Кому это нужно? На что будут потрачены деньги?"
                  style={{ minHeight: 140 }}
                  value={form.description} onChange={e => set('description', e.target.value)} />
                  <span style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>{form.description.length} символов (мин 20)</span>
                {errors.description && <span className="form-error">{errors.description}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Категория *</label>
                <div className="category-picker">
                  {CATEGORIES.map(cat => (
                    <button key={cat.slug} type="button"
                      className={`cat-pick-btn${form.category === cat.slug ? ' active' : ''}`}
                      onClick={() => set('category', cat.slug)}
                    >
                      <span>{cat.emoji}</span> {cat.label}
                    </button>
                  ))}
                </div>
                {errors.category && <span className="form-error">{errors.category}</span>}
              </div>
            </div>
          )}

          {/* STEP 1: Goal & Details */}
          {step === 1 && (
            <div className="step-content">
              <h3 className="step-title">Установите свою цель</h3>

              <div className="form-group">
                <label className="form-label">Цель сбора средств (KGS) *</label>
                <div className="input-with-unit">
                  <input className={`form-input${errors.goalAmount ? ' error' : ''}`} type="number" min="1000"
                    placeholder="50000"
                    value={form.goalAmount} onChange={e => set('goalAmount', e.target.value)} />
                  <span className="input-unit">KGS</span>
                </div>
                {form.goalAmount && Number(form.goalAmount) >= 1000 && (
                  <span style={{ fontSize: 13, color: 'var(--green)', marginTop: 4 }}>
                    ≈ {(Number(form.goalAmount) / 89).toFixed(0)} USD
                  </span>
                )}
                {errors.goalAmount && <span className="form-error">{errors.goalAmount}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Дедлайн (обязательно)</label>
                  <input className="form-input" type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={form.deadline} onChange={e => set('deadline', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Местоположение (обязательно)</label>
                  <input className="form-input" type="text" placeholder="Напр., Бишкек, Ош"
                    value={form.location} onChange={e => set('location', e.target.value)} />
                </div>
              </div>

              <label className="toggle-row">
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>Отметить как срочное</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Срочные сборы отображаются на главной странице и в результатах поиска в первую очередь.</p>
                </div>
                <div className={`toggle-switch${form.isUrgent ? ' on' : ''}`} onClick={() => set('isUrgent', !form.isUrgent)}>
                  <div className="toggle-thumb"/>
                </div>
              </label>
            </div>
          )}

          {/* STEP 2: Documents */}
          {step === 2 && (
            <div className="step-content">
              <h3 className="step-title">Загрузите подтверждающие документы</h3>
              <p className="step-desc">Документы подтверждают эффективность вашего сбора и повышают доверие доноров. Принимаются файлы в форматах PDF, JPG, PNG, DOC (максимальный размер каждого — 10 МБ).</p>

              <div className="upload-section">
                <label className="upload-box" htmlFor="docs-upload">
                  <span className="upload-icon">📄</span>
                  <p className="upload-title">Подтверждающие документы</p>
                  <p className="upload-hint">Медицинские справки, счета-фактуры, копии удостоверений личности, квитанции.</p>
                  <span className="btn btn-secondary btn-sm" style={{ pointerEvents: 'none', marginTop: 8 }}>Выбрать файлы</span>
                  <input id="docs-upload" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }}
                    onChange={e => setDocuments(Array.from(e.target.files))} />
                </label>
                {documents.length > 0 && (
                  <div className="file-list">
                    {documents.map((f, i) => (
                      <div key={i} className="file-item">
                        <span>📎</span> <span className="file-name">{f.name}</span>
                        <span className="file-size">{(f.size / 1024).toFixed(0)}KB</span>
                        <button type="button" className="file-remove" onClick={() => setDocuments(d => d.filter((_,j) => j !== i))}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="upload-section">
                <label className="upload-box" htmlFor="imgs-upload">
                  <span className="upload-icon">🖼</span>
                  <p className="upload-title">Изображения сбора</p>
                  <p className="upload-hint">Фотографии, связанные с вашей деятельностью (необязательно, но рекомендуется).</p>
                  <span className="btn btn-secondary btn-sm" style={{ pointerEvents: 'none', marginTop: 8 }}>Выберите изображения</span>
                  <input id="imgs-upload" type="file" multiple accept=".jpg,.jpeg,.png" style={{ display: 'none' }}
                    onChange={e => setImages(Array.from(e.target.files))} />
                </label>
                {images.length > 0 && (
                  <div className="img-preview-list">
                    {images.map((f, i) => (
                      <div key={i} className="img-preview">
                        <img src={URL.createObjectURL(f)} alt={f.name}/>
                        <button type="button" className="img-remove" onClick={() => setImages(d => d.filter((_,j) => j !== i))}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {step === 3 && (
            <div className="step-content">
              <h3 className="step-title">Проверьте свою кампанию</h3>
              <div className="review-grid">
                <div className="review-item"><span className="review-label">Название</span><span className="review-val">{form.title}</span></div>
                <div className="review-item"><span className="review-label">Категория</span>
                  <span className="review-val">{CATEGORIES.find(c => c.slug === form.category)?.emoji} {CATEGORIES.find(c => c.slug === form.category)?.label}</span>
                </div>
                <div className="review-item"><span className="review-label">Цель</span><span className="review-val">{Number(form.goalAmount).toLocaleString()} KGS</span></div>
                {form.deadline && <div className="review-item"><span className="review-label">Дедлайн</span><span className="review-val">{new Date(form.deadline).toLocaleDateString()}</span></div>}
                {form.location && <div className="review-item"><span className="review-label">Местоположение</span><span className="review-val">{form.location}</span></div>}
                <div className="review-item"><span className="review-label">Срочный</span><span className="review-val">{form.isUrgent ? '🔴 Да' : 'Нет'}</span></div>
                <div className="review-item"><span className="review-label">Документы</span><span className="review-val">{documents.length} файл(ов)</span></div>
                <div className="review-item"><span className="review-label">Изображения</span><span className="review-val">{images.length} файл(ов)</span></div>
              </div>
              <div className="review-desc">
                <span className="review-label">Описание</span>
                <p>{form.description}</p>
              </div>
              <div className="review-notice">
                ℹ️ Перед запуском ваш сбор будет проверена командой AdalHelp. Обычно это занимает 24–48 часов.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="step-nav">
            {step > 0 && (
              <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)} disabled={loading}>← Назад</button>
            )}
            <div style={{ flex: 1 }}/>
            {step < STEPS.length - 1 ? (
              <button className="btn btn-primary" onClick={nextStep}>Продолжить →</button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Отправка…' : '🚀 Отправить сбор'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}