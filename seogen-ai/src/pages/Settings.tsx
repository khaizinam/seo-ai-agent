import { useState } from 'react'
import DatabaseTab from './settings/DatabaseTab'
import AIProvidersTab from './settings/AIProvidersTab'
import AppearanceTab from './settings/AppearanceTab'
import AdvancedTab from './settings/AdvancedTab'

type SettingsTab = 'db' | 'ai' | 'appearance' | 'advanced'

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'db', label: '🗄️ Database' },
  { id: 'ai', label: '🤖 AI Providers' },
  { id: 'appearance', label: '🎨 Giao diện' },
  { id: 'advanced', label: '🛠️ Nâng cao' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('db')

  return (
    <div style={{ padding: 28, height: '100%', overflow: 'auto' }}>
      <div className="page-header">
        <h1 className="page-title">⚙️ Cài đặt</h1>
        <p className="page-subtitle">Quản lý hệ thống, giao diện & cấu hình AI</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
            color: tab === t.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: tab === t.id ? '2px solid var(--brand-primary)' : '2px solid transparent',
            fontWeight: tab === t.id ? 600 : 400, fontSize: 13, marginBottom: -1, transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'db' && <DatabaseTab />}
      {tab === 'ai' && <AIProvidersTab />}
      {tab === 'appearance' && <AppearanceTab />}
      {tab === 'advanced' && <AdvancedTab />}
    </div>
  )
}
