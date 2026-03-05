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
    { label: 'Điểm SEO TB', value: stats.avgScore, icon: TrendingUp, color: '#10b981', to: '/audit' },
  ]

  return (
    <div style={{ padding: 28 }}>
      <div className="page-header">
        <h1 className="page-title">👋 Dashboard</h1>
        <p className="page-subtitle">Tổng quan hệ thống SEOGEN AI</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
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
              { label: 'Quản lý Webhooks', to: '/webhook' },
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

      <div style={{ marginTop: 16 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14, color: 'var(--brand-primary)' }}>✨ Các tính năng nổi bật</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
            <div>
              <strong>🗄️ Đa dạng Database:</strong> Hỗ trợ kết nối và làm việc trực tiếp với MySQL, PostgreSQL, SQLite.
            </div>
            <div>
              <strong>♻️ AI tự động xoay:</strong> Khi model bị lỗi (hết rate limit hoặc sập), Auto-rotate sẽ tự đẩy sang model backup.
            </div>
            <div>
              <strong>✍️ Quản lý Giọng văn:</strong> Tuỳ biến đa dạng phong cách, kiểm soát toàn diện Campaign, Article, Keyword.
            </div>
            <div>
              <strong>🖼️ Xử lý Hình ảnh:</strong> Built-in tính năng nén dung lượng và chuyển đổi ảnh sang WebP tối ưu SEO.
            </div>
            <div>
              <strong>🧹 Dọn dẹp Thông minh:</strong> Cascade delete tự xóa rớt Data thừa (Meta/Image) & Clear cache cấu hình.
            </div>
            <div>
              <strong>🔗 Webhooks:</strong> Đẩy tự động và bắn Request POST/PUT thông minh sau khi bài viết hoàn thiện.
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to right, rgba(99,102,241,0.05), rgba(139,92,246,0.05))' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>SEOGEN AI v1.0.0</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Chuyên gia Sáng tạo Nội dung SEO Đỉnh cao.<br/>
              Tác giả: <strong>Khaizinam</strong> - Mong nhận được đóng góp và ý kiến của mọi người!
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <a href="http://www.khaizinam.io.vn" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--brand-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Globe size={14} /> Portfolio (khaizinam.io.vn)
            </a>
            <a href="https://github.com/khaizinam/seo-ai-agent" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              GitHub cập nhật version mới
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
