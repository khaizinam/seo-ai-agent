import { useEffect, useState } from 'react'
import { invoke } from '../lib/api'
import { Link } from 'react-router-dom'
import { Target, FileText, Globe, BarChart3, TrendingUp, Plus } from 'lucide-react'

interface Stats { campaigns: number; keywords: number; articles: number; avgScore: number }

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ campaigns: 0, keywords: 0, articles: 0, avgScore: 0 })
  const [recentArticles, setRecentArticles] = useState<Record<string, string | number>[]>([])

  useEffect(() => {
    Promise.all([
      invoke<Record<string, string | number>[]>('campaign:list'),
      invoke<Record<string, string | number>[]>('article:list'),
    ]).then(([campaigns, articles]) => {
      const c = campaigns || []; const a = articles || []
      const scores = a.map((x) => Number(x.seo_score) || 0).filter(s => s > 0)
      setStats({
        campaigns: c.length,
        keywords: 0,
        articles: a.length,
        avgScore: scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0,
      })
      setRecentArticles(a.slice(0, 5))
    }).catch(() => {})
  }, [])

  const cards = [
    { label: 'Chiến dịch', value: stats.campaigns, icon: Target, color: '#6366f1', to: '/campaign' },
    { label: 'Bài viết', value: stats.articles, icon: FileText, color: '#8b5cf6', to: '/article' },
    { label: 'Meta Manager', value: '→', icon: Globe, color: '#06b6d4', to: '/meta' },
    { label: 'Điểm SEO TB', value: stats.avgScore, icon: TrendingUp, color: '#10b981', to: '/audit' },
  ]

  return (
    <div style={{ padding: 28 }}>
      <div className="page-header">
        <h1 className="page-title">👋 Dashboard</h1>
        <p className="page-subtitle">Tổng quan hệ thống SEOGEN AI</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {cards.map(c => (
          <Link key={c.label} to={c.to} style={{ textDecoration: 'none' }}>
            <div className="glass-card" style={{ padding: 20, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = c.color)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.18)')}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <c.icon size={18} color={c.color} />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{c.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>⚡ Bắt đầu nhanh</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Tạo chiến dịch từ khoá mới', to: '/campaign' },
              { label: 'Tạo nhân vật viết bài', to: '/persona' },
              { label: 'Viết bài SEO mới', to: '/article' },
              { label: 'Quản lý Meta Title & Desc', to: '/meta' },
              { label: 'Generate thumbnail AI', to: '/thumbnail' },
            ].map(a => (
              <Link key={a.to} to={a.to}>
                <div className="btn-ghost" style={{ justifyContent: 'flex-start', width: '100%' }}>
                  <Plus size={12} color="var(--brand-primary)" /> {a.label}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            📄 Bài viết gần đây
            <Link to="/article" style={{ fontSize: 11, color: 'var(--brand-primary)' }}>Xem tất cả →</Link>
          </div>
          {recentArticles.length === 0
            ? <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', paddingTop: 20 }}>Chưa có bài viết nào</div>
            : recentArticles.map(a => (
              <div key={String(a.id)} style={{ padding: '8px 0', borderBottom: '1px solid rgba(30,41,59,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{a.title as string}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{(a.keyword as string) || '—'}</div>
                </div>
                <span style={{ fontWeight: 700, fontSize: 12, color: Number(a.seo_score) >= 70 ? '#10b981' : '#f59e0b', flexShrink: 0 }}>
                  {String(a.seo_score || 0)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
