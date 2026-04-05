import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import '../component-styles/DonateModal.css'

const CURRENCIES = ['KGS','USD','EUR','RUB','KZT','GBP','CNY','TRY','AED']

export default function DonateModal({ campaign, onClose, onSuccess }) {
  useAuth()

  const [amount,      setAmount]      = useState('')
  const [currency,    setCurrency]    = useState('KGS')
  const [anonymous,   setAnonymous]   = useState(false)
  const [donorType,   setDonorType]   = useState('individual')
  const [message,     setMessage]     = useState('')
  const [amountKGS,   setAmountKGS]   = useState(null)
  const [rate,        setRate]        = useState(null)
  const [converting,  setConverting]  = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')
  const [step,        setStep]        = useState(1) // 1=amount, 2=confirm

  // Live conversion preview
  useEffect(() => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setAmountKGS(null); setRate(null); return
    }
    if (currency === 'KGS') {
      setAmountKGS(Number(amount)); setRate(1); return
    }
    const timer = setTimeout(async () => {
      setConverting(true)
      try {
        const res = await api.get('/transactions/convert', { params: { amount, from: currency } })
        setAmountKGS(res.data.amountKGS)
        setRate(res.data.rate)
      } catch { setAmountKGS(null) }
      finally { setConverting(false) }
    }, 400)
    return () => clearTimeout(timer)
  }, [amount, currency])

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    try {
      const res = await api.post('/transactions/donate', {
        campaignId: campaign._id,
        amount: Number(amount),
        currency,
        isAnonymous: anonymous,
        donorType,
        message,
      })
      onSuccess?.(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Пожертвование не удалось. Пожалуйста, попробуйте еще раз.')
    } finally {
      setSubmitting(false)
    }
  }

  const progress = Math.min(Math.round((campaign.raisedAmount / campaign.goalAmount) * 100), 100)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal donate-modal">

        {/* Header */}
        <div className="donate-header">
          <div>
            <p className="donate-label">Пожертвование для</p>
            <h3 className="donate-title">{campaign.title}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Campaign mini-progress */}
        <div className="donate-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}/>
          </div>
          <p className="donate-raised">
            <strong>{campaign.raisedAmount?.toLocaleString()} KGS</strong> собрано из {campaign.goalAmount?.toLocaleString()} KGS
          </p>
        </div>

        {step === 1 && (
          <div className="donate-step">
            {/* Quick amounts */}
            <div className="quick-amounts">
              {[500,1000,2500,5000].map(v => (
                <button
                  key={v}
                  className={`quick-btn${amount == v ? ' active' : ''}`}
                  onClick={() => setAmount(String(v))}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Amount + currency */}
            <div className="amount-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Сумма</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  placeholder="Введите сумму"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Валюта</label>
                <select
                  className="form-select"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  style={{ width: 100 }}
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Conversion display */}
            {amount && currency !== 'KGS' && (
              <div className="conversion-box">
                {converting ? (
                  <span className="converting-text">Конвертация…</span>
                ) : amountKGS ? (
                  <>
                    <span className="conversion-result">≈ {amountKGS?.toLocaleString()} KGS</span>
                    <span className="conversion-rate">1 {currency} = {rate} KGS</span>
                  </>
                ) : null}
              </div>
            )}

            {/* Donor type */}
            <div className="form-group">
              <label className="form-label">Пожертвование как</label>
              <div className="radio-row">
                {['individual','legal_entity'].map(t => (
                  <label key={t} className={`radio-option${donorType === t ? ' active' : ''}`}>
                    <input type="radio" name="donorType" value={t} checked={donorType===t} onChange={() => setDonorType(t)} />
                    {t === 'individual' ? '👤 Физическое лицо' : '🏢 Организация'}
                  </label>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="form-group">
              <label className="form-label">Сообщение (необязательно)</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Оставьте слово поддержки…"
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={300}
                style={{ minHeight: 72 }}
              />
            </div>

            {/* Anonymous toggle */}
            <label className="toggle-row">
              <span className="toggle-label">Пожертвовать анонимно</span>
              <div
                className={`toggle-switch${anonymous ? ' on' : ''}`}
                onClick={() => setAnonymous(v => !v)}
              >
                <div className="toggle-thumb"/>
              </div>
            </label>

            <button
              className="btn btn-primary btn-lg donate-submit"
              disabled={!amount || Number(amount) <= 0}
              onClick={() => setStep(2)}
            >
              Продолжить →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="donate-step">
            <div className="confirm-box">
              <p className="confirm-label">Вы пожертвуете</p>
              <p className="confirm-amount">{Number(amount).toLocaleString()} {currency}</p>
              {currency !== 'KGS' && amountKGS && (
                <p className="confirm-kgs">≈ {amountKGS.toLocaleString()} KGS</p>
              )}
              <p className="confirm-to">для <strong>{campaign.title}</strong></p>
              {anonymous && <p className="confirm-anon">🕶 Анонимно</p>}
              {message && <p className="confirm-message">"{message}"</p>}
            </div>

            {error && <p className="form-error" style={{ textAlign: 'center' }}>{error}</p>}

            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setStep(1)} disabled={submitting}>
                ← Редактировать
              </button>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSubmit}
                disabled={submitting}
                style={{ flex: 1 }}
              >
                {submitting ? 'Обработка…' : '💚 Подтвердить пожертвование'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}