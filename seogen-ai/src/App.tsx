import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, Target, Users, FileText, Image, BarChart3,
  Settings, ChevronRight, Zap, Database, Globe
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import CampaignPage from './pages/Campaign'
import PersonaPage from './pages/Persona'
import ArticlePage from './pages/Article'
import MetaManagerPage from './pages/MetaManager'
import ThumbnailPage from './pages/Thumbnail'
import AuditPage from './pages/Audit'
import SettingsPage from './pages/Settings'
import { useAppStore } from './stores/app.store'
import { useEffect } from 'react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/campaign', icon: Target, label: 'Chiến dịch' },
  { to: '/persona', icon: Users, label: 'Nhân vật viết bài' },
  { to: '/article', icon: FileText, label: 'Bài viết' },
  { to: '/meta', icon: Globe, label: 'Meta SEO Manager' },
  { to: '/thumbnail', icon: Image, label: 'Thumbnail AI' },
  { to: '/audit', icon: BarChart3, label: 'SEO Audit' },
  { to: '/settings', icon: Settings, label: 'Cài đặt' },
]

export default function App() {
  const { dbConnected, setDbConnected } = useAppStore()

  useEffect(() => {
    // Auto-reconnect DB on startup
    window.api.invoke('db:reconnect').then((res: unknown) => {
      const r = res as { success: boolean }
      setDbConnected(r.success)
    })
  }, [])

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{
          width: 240, flexShrink: 0,
          background: 'linear-gradient(180deg, #0d1424 0%, #0a0f1e 100%)',
          borderRight: '1px solid rgba(99,102,241,0.12)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}>
          {/* Logo */}
          <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(99,102,241,0.4)',
              }}>
                <Zap size={18} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>
                  <span className="gradient-text">SEOGEN</span> AI
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>v1.0.0</div>
              </div>
            </div>

            {/* DB status */}
            <div style={{
              marginTop: 12, padding: '6px 10px', borderRadius: 8,
              background: dbConnected ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${dbConnected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
            }}>
              <Database size={12} color={dbConnected ? '#10b981' : '#ef4444'} />
              <span style={{ color: dbConnected ? '#10b981' : '#ef4444' }}>
                {dbConnected ? 'Database Connected' : 'Database Offline'}
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: '12px 10px', flex: 1 }}>
            {NAV.map(({ to, icon: Icon, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                style={{ marginBottom: 2, textDecoration: 'none' }}
              >
                <Icon size={16} />
                <span style={{ flex: 1 }}>{label}</span>
                <ChevronRight size={12} style={{ opacity: 0.3 }} />
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--surface-0)' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/campaign" element={<CampaignPage />} />
            <Route path="/persona" element={<PersonaPage />} />
            <Route path="/article" element={<ArticlePage />} />
            <Route path="/meta" element={<MetaManagerPage />} />
            <Route path="/thumbnail" element={<ThumbnailPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
