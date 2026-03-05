import { HashRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Target, Users, FileText, Image, BarChart3,
  Settings, ChevronRight, Zap, Database, Globe, AlertTriangle, ImageDown
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import CampaignIndex from './pages/campaigns/CampaignIndex'
import CampaignForm from './pages/campaigns/CampaignForm'
import PersonaPage from './pages/Persona'
import ArticleIndex from './pages/articles/ArticleIndex'
import ArticleForm from './pages/articles/ArticleForm'
import MetaManagerPage from './pages/MetaManager'
import ThumbnailPage from './pages/Thumbnail'
import AuditPage from './pages/Audit'
import SettingsPage from './pages/Settings'
import ImageConverterPage from './pages/ImageConverter'
import { useAppStore } from './stores/app.store'
import { Toast } from './components/ui/Toast'
import { useEffect } from 'react'

const NAV_MAIN = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/campaign', icon: Target, label: 'Chiến dịch' },
  { to: '/persona', icon: Users, label: 'Nhân vật viết bài' },
  { to: '/article', icon: FileText, label: 'Bài viết' },
  { to: '/meta', icon: Globe, label: 'Meta SEO Manager' },
  { to: '/thumbnail', icon: Image, label: 'Thumbnail AI' },
  { to: '/audit', icon: BarChart3, label: 'SEO Audit' },
]

const NAV_SETTING = [
  { to: '/image-converter', icon: ImageDown, label: 'Chuyển đổi ảnh' },
  { to: '/settings', icon: Settings, label: 'Cài đặt' },
]

function SetupPrompt() {
  const navigate = useNavigate()
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface-0)', gap: 24, padding: 40,
      animation: 'fadeIn 0.4s ease-out',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 20,
        background: 'rgba(245,158,11,0.1)',
        border: '1px solid rgba(245,158,11,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <AlertTriangle size={36} color="#f59e0b" />
      </div>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
          Bạn chưa cấu hình Database
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
          Ứng dụng cần kết nối tới Database để lưu trữ dữ liệu bài viết, chiến dịch và cấu hình AI.<br />
          Vui lòng vào <strong style={{ color: 'var(--brand-primary)' }}>Cài đặt &gt; Database</strong> để bắt đầu.
        </p>
        <button
          className="btn-primary"
          style={{ justifyContent: 'center', fontSize: 15, padding: '12px 32px' }}
          onClick={() => navigate('/settings')}
        >
          <Settings size={16} /> Đi tới Cài đặt
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const { dbConnected, setDbConnected, theme, setTheme, setOutputLanguage } = useAppStore()

  useEffect(() => {
    // Auto-reconnect DB on startup
    window.api.invoke('db:reconnect').then((res: unknown) => {
      const r = res as { success: boolean }
      setDbConnected(r.success)
    })

    // Load theme and outputLanguage from settings
    window.api.invoke('settings:getAll').then((res: any) => {
      if (res?.theme) {
        setTheme(res.theme)
      }
      if (res?.outputLanguage) {
        setOutputLanguage(res.outputLanguage)
      }
    })
  }, [])

  useEffect(() => {
    const applyTheme = (t: string) => {
      let activeTheme = t
      if (t === 'auto') {
        activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      document.documentElement.setAttribute('data-theme', activeTheme)
    }

    applyTheme(theme)

    // Listen for system theme changes if in 'auto' mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'auto') applyTheme('auto')
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  return (
    <HashRouter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{
          width: 240, flexShrink: 0,
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
          transition: 'background 0.4s ease, border-color 0.4s ease',
        }}>
          {/* Logo */}
          <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
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
                <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
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
              transition: 'all 0.4s ease',
            }}>
              <Database size={12} color={dbConnected ? '#10b981' : '#ef4444'} />
              <span style={{ color: dbConnected ? '#10b981' : '#ef4444', fontWeight: 500, transition: 'color 0.4s ease' }}>
                {dbConnected ? 'Database Connected' : 'Database Offline'}
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: '12px 10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Main nav - only shown when DB connected */}
            {dbConnected && (
              <div style={{ marginBottom: 4 }}>
                {NAV_MAIN.map(({ to, icon: Icon, label, exact }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={exact}
                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                    style={{ marginBottom: 2, textDecoration: 'none', display: 'flex' }}
                  >
                    <Icon size={16} />
                    <span style={{ flex: 1 }}>{label}</span>
                    <ChevronRight size={12} style={{ opacity: 0.3 }} />
                  </NavLink>
                ))}
              </div>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Settings - always visible */}
            <div style={{ paddingTop: 8, borderTop: '1px solid rgba(99,102,241,0.1)' }}>
              {NAV_SETTING.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  style={{ textDecoration: 'none', display: 'flex' }}
                >
                  <Icon size={16} />
                  <span style={{ flex: 1 }}>{label}</span>
                  <ChevronRight size={12} style={{ opacity: 0.3 }} />
                </NavLink>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--surface-0)', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/image-converter" element={<ImageConverterPage />} />
            {dbConnected ? (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/campaign" element={<CampaignIndex />} />
                <Route path="/campaign/create" element={<CampaignForm />} />
                <Route path="/campaign/edit/:id" element={<CampaignForm />} />
                <Route path="/persona" element={<PersonaPage />} />
                <Route path="/article" element={<ArticleIndex />} />
                <Route path="/article/create" element={<ArticleForm />} />
                <Route path="/article/edit/:id" element={<ArticleForm />} />
                <Route path="/meta" element={<MetaManagerPage />} />
                <Route path="/thumbnail" element={<ThumbnailPage />} />
                <Route path="/audit" element={<AuditPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="*" element={<SetupPrompt />} />
              </>
            )}
          </Routes>
        </main>
      </div>
      <Toast />
    </HashRouter>
  )
}
