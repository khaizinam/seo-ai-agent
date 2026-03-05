import { useState } from 'react'
import { invoke } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'
import { Sun, Moon, Monitor, Palette, Globe } from 'lucide-react'

const LANGUAGE_OPTIONS = [
  { id: 'Vietnamese', label: '🇻🇳 Tiếng Việt' },
  { id: 'English', label: '🇺🇸 English' },
  { id: 'other', label: '🌍 Khác (tự nhập)' },
] as const

export default function AppearanceTab() {
  const { theme, setTheme, outputLanguage, setOutputLanguage } = useAppStore()
  const [customLang, setCustomLang] = useState(
    outputLanguage !== 'Vietnamese' && outputLanguage !== 'English' ? outputLanguage : ''
  )
  const isOther = outputLanguage !== 'Vietnamese' && outputLanguage !== 'English'

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme)
    await invoke('settings:set', { key: 'theme', value: newTheme })
  }

  const handleLanguageChange = async (langId: string) => {
    if (langId === 'other') {
      // Switch to "other" mode — keep current custom or set empty
      const lang = customLang || ''
      setOutputLanguage(lang)
      if (lang) await invoke('settings:set', { key: 'outputLanguage', value: lang })
    } else {
      setOutputLanguage(langId)
      setCustomLang('')
      await invoke('settings:set', { key: 'outputLanguage', value: langId })
    }
  }

  const handleCustomLangSave = async () => {
    if (!customLang.trim()) return
    setOutputLanguage(customLang.trim())
    await invoke('settings:set', { key: 'outputLanguage', value: customLang.trim() })
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Theme */}
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

      {/* Output Language */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={16} color="var(--brand-primary)" /> Ngôn ngữ đầu ra AI
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Chọn ngôn ngữ mà AI sẽ sinh nội dung (bài viết, social, meta...). Prompt vẫn gửi tiếng Anh để tiết kiệm token.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {LANGUAGE_OPTIONS.map((item) => {
            const isActive = item.id === 'other'
              ? isOther
              : outputLanguage === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleLanguageChange(item.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '20px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                  background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'var(--surface-2)',
                  border: `1px solid ${isActive ? 'var(--brand-primary)' : 'var(--border)'}`,
                  color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                }}
              >
                <span style={{ fontSize: 20 }}>{item.label.split(' ')[0]}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{item.label.split(' ').slice(1).join(' ')}</span>
              </button>
            )
          })}
        </div>

        {/* Custom language input */}
        {isOther && (
          <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="input"
              placeholder="Nhập tên ngôn ngữ (VD: Japanese, Korean, Thai...)"
              value={customLang}
              onChange={e => setCustomLang(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              className="btn-primary"
              onClick={handleCustomLangSave}
              disabled={!customLang.trim()}
              style={{ whiteSpace: 'nowrap' }}
            >
              Lưu
            </button>
          </div>
        )}

        {/* Current language badge */}
        <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={14} color="var(--text-muted)" />
          <span style={{ color: 'var(--text-muted)' }}>Đang dùng:</span>
          <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{outputLanguage || 'Vietnamese'}</span>
        </div>
      </div>
    </div>
  )
}
