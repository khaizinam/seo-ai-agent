import { invoke } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'
import { Sun, Moon, Monitor, Palette } from 'lucide-react'

export default function AppearanceTab() {
  const { theme, setTheme } = useAppStore()

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme)
    await invoke('settings:set', { key: 'theme', value: newTheme })
  }

  return (
    <div className="animate-fade-in">
      <div className="glass-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Palette size={16} color="var(--brand-primary)" /> Tuỳ chọn giao diện
        </h2>
        
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Chọn chế độ hiển thị phù hợp với môi trường làm việc của bạn.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {([
            { id: 'light', label: 'Sáng', icon: Sun },
            { id: 'dark', label: 'Tối', icon: Moon },
            { id: 'auto', label: 'Hệ thống', icon: Monitor },
          ] as const).map((item) => {
            const Icon = item.icon
            const isActive = theme === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleThemeChange(item.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  padding: '24px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                  background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'var(--surface-2)',
                  border: `1px solid ${isActive ? 'var(--brand-primary)' : 'var(--border)'}`,
                  color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={24} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
