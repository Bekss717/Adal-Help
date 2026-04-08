import { useState, useEffect } from 'react'
import { ConfigProvider, theme, Statistic, Card, Table, Tag, Spin, Empty } from 'antd'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart
} from 'recharts'
import api from '../utils/api'
import '../page-styles/AnalyticsPage.css'

// ── Category display metadata ──────────────────────────────────────────────────
const CAT_META = {
  medical:    { label: 'Medical',       emoji: '🏥', color: '#00A86B' },
  children:   { label: 'Children',      emoji: '👶', color: '#3B82F6' },
  elderly:    { label: 'Elderly',       emoji: '👴', color: '#8B5CF6' },
  pets:       { label: 'Pets',          emoji: '🐾', color: '#F59E0B' },
  disability: { label: 'Disabilities',  emoji: '♿', color: '#EC4899' },
  disaster:   { label: 'Disaster',      emoji: '🆘', color: '#EF4444' },
  education:  { label: 'Education',     emoji: '📚', color: '#06B6D4' },
  other:      { label: 'Other',         emoji: '💛', color: '#84CC16' },
}

const STATUS_COLORS = {
  active:    '#00A86B',
  completed: '#3B82F6',
  pending:   '#F59E0B',
  frozen:    '#EF4444',
  rejected:  '#6B7280',
}

function formatKGS(n) {
  if (!n) return '0 KGS'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M KGS`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K KGS`
  return `${Math.round(n)} KGS`
}

// Custom tooltip for PieChart
const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{d.name}</p>
      <p className="tooltip-value">{formatKGS(d.value)}</p>
      <p className="tooltip-pct">{d.payload.percent}% of total</p>
    </div>
  )
}

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tooltip-value" style={{ color: p.color }}>
          {p.name}: {p.name === 'Raised' ? formatKGS(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

const CustomLineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      <p className="tooltip-value">{formatKGS(payload[0]?.value)}</p>
      <p className="tooltip-pct">{payload[1]?.value} donations</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // Detect dark mode for Ant Design theme
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

  useEffect(() => {
    api.get('/campaigns/analytics')
      .then(res => setData(res.data.analytics))
      .catch(() => setError('Could not load analytics. Make sure your backend is running.'))
      .finally(() => setLoading(false))
  }, [])

  // ── Pie chart: raised by category ─────────────────────────────────────────
  const categoryPieData = (data?.byCategory || []).map(c => ({
    name:    CAT_META[c._id]?.emoji + ' ' + (CAT_META[c._id]?.label || c._id),
    value:   Math.round(c.totalRaised),
    count:   c.count,
    color:   CAT_META[c._id]?.color || '#8B5CF6',
    percent: data?.totals?.totalRaisedKGS
      ? Math.round((c.totalRaised / data.totals.totalRaisedKGS) * 100)
      : 0,
  })).filter(d => d.value > 0)

  // ── Pie chart: campaigns by status ────────────────────────────────────────
  const statusPieData = (data?.byStatus || []).map(s => ({
    name:  s._id.charAt(0).toUpperCase() + s._id.slice(1),
    value: s.count,
    color: STATUS_COLORS[s._id] || '#8B5CF6',
  }))

  // ── Bar chart: campaigns by category ─────────────────────────────────────
  const categoryBarData = (data?.byCategory || []).map(c => ({
    category: CAT_META[c._id]?.label || c._id,
    Raised:   Math.round(c.totalRaised),
    Goal:     Math.round(c.totalGoal),
    Campaigns: c.count,
  }))

  // ── Area chart: donations over time ───────────────────────────────────────
  const timelineData = (data?.donationsOverTime || []).map(d => ({
    date:  d._id.slice(5),   // "MM-DD"
    KGS:   Math.round(d.totalKGS),
    count: d.count,
  }))

  // ── Top campaigns table columns ───────────────────────────────────────────
  const topColumns = [
    {
      title: 'Campaign',
      dataIndex: 'title',
      key: 'title',
      render: (text, r) => (
        <span>
          <span style={{ marginRight: 6 }}>{CAT_META[r.category]?.emoji}</span>
          {text}
          {r.isUrgent && <Tag color="red" style={{ marginLeft: 8, fontSize: 10 }}>URGENT</Tag>}
        </span>
      ),
    },
    {
      title: 'Raised',
      dataIndex: 'raisedAmount',
      key: 'raised',
      render: v => <span style={{ color: 'var(--green)', fontWeight: 700 }}>{formatKGS(v)}</span>,
      sorter: (a, b) => a.raisedAmount - b.raisedAmount,
      defaultSortOrder: 'descend',
    },
    {
      title: 'Goal',
      dataIndex: 'goalAmount',
      key: 'goal',
      render: v => formatKGS(v),
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, r) => {
        const pct = Math.min(Math.round((r.raisedAmount / r.goalAmount) * 100), 100)
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="progress-bar" style={{ flex: 1, height: 6 }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 32 }}>{pct}%</span>
          </div>
        )
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: v => <Tag color="green">{CAT_META[v]?.label || v}</Tag>,
    },
  ]

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary:   '#00A86B',
          borderRadius:   10,
          fontFamily:     "'DM Sans', sans-serif",
          colorBgContainer: isDark ? '#111E2C' : '#FFFFFF',
          colorBorder:    isDark ? '#1E3348' : '#E4E0D8',
          colorText:      isDark ? '#E8F0F7' : '#0D1F2D',
          colorTextSecondary: isDark ? '#7A94A8' : '#5A6A7A',
        },
      }}
    >
      <div className="analytics-page">
        <div className="analytics-header">
          <div className="container">
            <p className="section-label">Текущие данные</p>
            <h1 className="analytics-title">Аналитика платформы</h1>
            <p className="analytics-subtitle">Статистика в режиме реального времени по всем сборам и пожертвованиям.</p>
          </div>
        </div>

        <div className="container analytics-body">

          {loading && (
            <div className="analytics-loading">
              <Spin size="large" />
              <p>Загрузка аналитики…</p>
            </div>
          )}

          {error && (
            <div className="analytics-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* ── STAT CARDS ─────────────────────────────────────────────── */}
              <div className="stat-cards">
                <Card className="stat-card" bordered={false}>
                  <Statistic
                    title="Total Raised"
                    value={formatKGS(data.totals?.totalRaisedKGS)}
                    valueStyle={{ color: 'var(--green)', fontFamily: 'var(--font-display)', fontSize: 28 }}
                    prefix="💰"
                  />
                </Card>
                <Card className="stat-card" variant="borderless">
                  <Statistic
                    title="Всего пожертвований"
                    value={data.totals?.totalDonations || 0}
                    valueStyle={{ color: '#3B82F6', fontFamily: 'var(--font-display)', fontSize: 28 }}
                    prefix="💚"
                  />
                </Card>
                <Card className="stat-card" variant="borderless">
                  <Statistic
                    title="Активные сборы"
                    value={data.totals?.activeCount || 0}
                    valueStyle={{ color: 'var(--green)', fontFamily: 'var(--font-display)', fontSize: 28 }}
                    prefix="📋"
                  />
                </Card>
                <Card className="stat-card" variant="borderless">
                  <Statistic
                    title="Завершенные"
                    value={data.totals?.completedCount || 0}
                    valueStyle={{ color: '#8B5CF6', fontFamily: 'var(--font-display)', fontSize: 28 }}
                    prefix="✅"
                  />
                </Card>
                <Card className="stat-card" variant="borderless">
                  <Statistic
                    title="Срочные сборы"
                    value={data.totals?.urgentCount || 0}
                    valueStyle={{ color: '#EF4444', fontFamily: 'var(--font-display)', fontSize: 28 }}
                    prefix="🔴"
                  />
                </Card>
                <Card className="stat-card" variant="borderless">
                  <Statistic
                    title="Ожидает рассмотрения"
                    value={data.totals?.pendingCount || 0}
                    valueStyle={{ color: '#F59E0B', fontFamily: 'var(--font-display)', fontSize: 28 }}
                    prefix="⏳"
                  />
                </Card>
              </div>

              {/* ── PIE CHARTS ROW ─────────────────────────────────────────── */}
              <div className="charts-row">

                {/* Pie: Raised by Category */}
                <Card className="chart-card" title="💰 Собранные средства по категориям" bordered={false}>
                  {categoryPieData.length === 0 ? (
                    <Empty description="Данные о пожертвованиях пока отсутствуют." />
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={categoryPieData}
                          cx="50%"
                          cy="45%"
                          outerRadius={110}
                          innerRadius={55}
                          dataKey="value"
                          paddingAngle={3}
                          label={({ percent }) =>
                            percent > 5 ? `${percent}%` : ''
                          }
                          labelLine={false}
                        >
                          {categoryPieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend
                          formatter={(value) => <span style={{ fontSize: 12, color: 'var(--text)' }}>{value}</span>}
                          iconType="circle"
                          iconSize={10}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card>

                {/* Pie: Campaigns by Status */}
                <Card className="chart-card" title="📊 Кампании по статусу" bordered={false}>
                  {statusPieData.length === 0 ? (
                    <Empty description="Кампаний пока нет" />
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="45%"
                          outerRadius={110}
                          innerRadius={55}
                          dataKey="value"
                          paddingAngle={3}
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}
                        >
                          {statusPieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, name) => [v, name]} />
                        <Legend
                          formatter={(value) => <span style={{ fontSize: 12, color: 'var(--text)' }}>{value}</span>}
                          iconType="circle"
                          iconSize={10}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>

              {/* ── BAR CHART: By Category ─────────────────────────────────── */}
              {categoryBarData.length > 0 && (
                <Card className="chart-card chart-wide" title="🏷️ Собранные средства против запланированных по категориям" bordered={false}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryBarData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="category" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                      <YAxis tickFormatter={v => v >= 1000 ? `${v/1000}K` : v} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Legend />
                      <Bar dataKey="Raised" fill="#00A86B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Goal"   fill="#E4E0D8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* ── AREA CHART: Donations over time ───────────────────────── */}
              {timelineData.length > 0 && (
                <Card className="chart-card chart-wide" title="📈 Пожертвования за последние 30 дней" bordered={false}>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={timelineData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#00A86B" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00A86B" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <YAxis tickFormatter={v => v >= 1000 ? `${v/1000}K` : v} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <Tooltip content={<CustomLineTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="KGS"
                        stroke="#00A86B"
                        strokeWidth={2.5}
                        fill="url(#greenGrad)"
                        dot={{ r: 4, fill: '#00A86B', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#00A86B' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* ── TOP CAMPAIGNS TABLE ────────────────────────────────────── */}
              {(data.topCampaigns || []).length > 0 && (
                <Card className="chart-card chart-wide" title="🏆 Лучшие сборы по собранным средствам" bordered={false}>
                  <Table
                    dataSource={data.topCampaigns.map((c, i) => ({ ...c, key: i }))}
                    columns={topColumns}
                    pagination={false}
                    size="middle"
                    scroll={{ x: 600 }}
                  />
                </Card>
              )}

              {/* Empty state if no data at all */}
              {categoryPieData.length === 0 && statusPieData.every(s => s.value === 0) && (
                <div className="analytics-empty">
                  <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
                  <h3>Данных пока нет</h3>
                  <p>Создайте сбор и добавьте пожертвования — диаграммы появятся здесь автоматически.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ConfigProvider>
  )
}