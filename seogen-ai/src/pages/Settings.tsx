import { useState, useEffect } from 'react'
import { invoke } from '../lib/api'
import { useAppStore } from '../stores/app.store'
import {
  Database, Key, ChevronDown, ChevronUp, CheckCircle2, XCircle,
  Loader2, Eye, EyeOff, FolderOpen, RotateCcw, Save
} from 'lucide-react'

const DB_TYPES = [
  { value: 'mysql', label: 'MySQL', defaultPort: 3306 },
  { value: 'mariadb', label: 'MariaDB', defaultPort: 3306 },
  { value: 'postgresql', label: 'PostgreSQL', defaultPort: 5432 },
]

const AI_PROVIDERS = [
  { key: 'gemini', label: 'Google Gemini', keyField: 'geminiKey', modelField: 'geminiModel', models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
  { key: 'claude', label: 'Anthropic Claude', keyField: 'claudeKey', modelField: 'claudeModel', models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'] },
  { key: 'copilot', label: 'OpenAI / Copilot', keyField: 'copilotKey', modelField: 'copilotModel', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
]

export default function SettingsPage() {
  const [tab, setTab] = useState<'db' | 'ai'>('db')
  const { setDbConnected } = useAppStore()

  // DB state
  const [dbType, setDbType] = useState('mysql')
  const [dbHost, setDbHost] = useState('localhost')
  const [dbPort, setDbPort] = useState(3306)
  const [dbName, setDbName] = useState('seogen_ai')
  const [dbUser, setDbUser] = useState('root')
  const [dbPass, setDbPass] = useState('')
  const [dbSsl, setDbSsl] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [dbStatus, setDbStatus] = useState<{ ok?: boolean; msg?: string } | null>(null)
  const [dbLoading, setDbLoading] = useState(false)

  // AI state
  const [aiConfig, setAiConfig] = useState<Record<string, string>>({})
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; msg: string }>>({})
  const [testingKey, setTestingKey] = useState<string | null>(null)
  const [nanoBananaKey, setNanoBananaKey] = useState('')
  const [defaultProvider, setDefaultProvider] = useState('gemini')
  const [expandedAI, setExpandedAI] = useState<string | null>('gemini')
  const [rawKeys, setRawKeys] = useState<Record<string, string>>({})

  useEffect(() => {
    // Load saved DB config
    invoke<{
      host?: string; port?: number; database?: string; user?: string;
      type?: string; ssl?: boolean
    } | null>('db:getConfig').then(cfg => {
      if (cfg) {
        setDbType(cfg.type || 'mysql')
        setDbHost(cfg.host || 'localhost')
        setDbPort(cfg.port || 3306)
        setDbName(cfg.database || 'seogen_ai')
        setDbUser(cfg.user || 'root')
        setDbSsl(cfg.ssl || false)
      }
    })
    // Load AI config (masked)
    invoke<Record<string, string> | null>('ai:getConfig').then(cfg => {
      if (cfg) {
        setAiConfig(cfg)
        setDefaultProvider(cfg.defaultProvider || 'gemini')
      }
    })
  }, [])

  async function handleDbConnect() {
    setDbLoading(true); setDbStatus(null)
    const res = await invoke<{ success: boolean; message: string }>('db:connect', {
      type: dbType, host: dbHost, port: dbPort, database: dbName, user: dbUser, password: dbPass, ssl: dbSsl
    })
    setDbStatus({ ok: res.success, msg: res.message })
    setDbConnected(res.success)
    setDbLoading(false)
  }

  async function handleTestKey(provider: string, keyField: string) {
    const key = rawKeys[keyField]
    if (!key) return
    setTestingKey(provider)
    const res = await invoke<{ success: boolean; message: string }>('ai:testKey', { provider, key })
    setTestResults(p => ({ ...p, [provider]: { ok: res.success, msg: res.message } }))
    setTestingKey(null)
  }

  async function handleSaveAI() {
    const merged = { ...aiConfig, ...rawKeys, defaultProvider, nanoBananaKey: rawKeys.nanoBananaKey || aiConfig.nanoBananaKey || '' }
    await invoke('settings:saveAiConfig', merged)
    await invoke('ai:saveConfig', merged)
    setTestResults(p => ({ ...p, _saved: { ok: true, msg: 'Đã lưu cấu hình!' } }))
    setTimeout(() => setTestResults(p => { const n = { ...p }; delete n._saved; return n }), 2000)
  }

  const dbTypeInfo = DB_TYPES.find(d => d.value === dbType)

  return (
    <div style={{ padding: 28, height: '100%', overflow: 'auto', maxWidth: 860 }}>
      <div className="page-header">
        <h1 className="page-title">⚙️ Cài đặt</h1>
        <p className="page-subtitle">Kết nối Database & cấu hình AI API keys</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[{ id: 'db', label: '🗄️ Database' }, { id: 'ai', label: '🤖 AI Providers' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as 'db' | 'ai')} style={{
            padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
            color: tab === t.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: tab === t.id ? '2px solid var(--brand-primary)' : '2px solid transparent',
            fontWeight: tab === t.id ? 600 : 400, fontSize: 14, marginBottom: -1, transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* DB Tab */}
      {tab === 'db' && (
        <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={16} color="var(--brand-primary)" /> Kết nối Database
          </h2>

          {/* DB Type */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
            {DB_TYPES.map(d => (
              <button key={d.value} onClick={() => { setDbType(d.value); setDbPort(d.defaultPort) }} style={{
                padding: '10px 8px', borderRadius: 8, border: `1px solid ${dbType === d.value ? 'var(--brand-primary)' : 'var(--border)'}`,
                background: dbType === d.value ? 'rgba(99,102,241,0.12)' : 'var(--surface-2)',
                color: dbType === d.value ? 'var(--brand-primary)' : 'var(--text-secondary)',
                cursor: 'pointer', fontWeight: dbType === d.value ? 600 : 400, fontSize: 13, transition: 'all 0.15s',
              }}>{d.label}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, marginBottom: 12 }}>
            <div><label className="label">Host</label><input className="input" value={dbHost} onChange={e => setDbHost(e.target.value)} placeholder="localhost" /></div>
            <div><label className="label">Port</label><input className="input" type="number" value={dbPort} onChange={e => setDbPort(+e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Database name</label>
            <input className="input" value={dbName} onChange={e => setDbName(e.target.value)} placeholder="seogen_ai" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label className="label">Username</label><input className="input" value={dbUser} onChange={e => setDbUser(e.target.value)} /></div>
            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPass ? 'text' : 'password'} value={dbPass} onChange={e => setDbPass(e.target.value)} style={{ paddingRight: 36 }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <input type="checkbox" id="ssl" checked={dbSsl} onChange={e => setDbSsl(e.target.checked)} style={{ cursor: 'pointer' }} />
            <label htmlFor="ssl" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>Bật SSL (cho remote DB)</label>
          </div>

          {dbStatus && (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
              background: dbStatus.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${dbStatus.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: dbStatus.ok ? '#10b981' : '#ef4444', fontSize: 13,
            }}>
              {dbStatus.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />} {dbStatus.msg}
            </div>
          )}

          <button className="btn-primary" onClick={handleDbConnect} disabled={dbLoading} style={{ width: '100%', justifyContent: 'center' }}>
            {dbLoading ? <><Loader2 size={14} className="animate-spin" /> Đang kết nối...</> : <><Database size={14} /> Kết nối & Lưu</>}
          </button>
        </div>
      )}

      {/* AI Tab */}
      {tab === 'ai' && (
        <div className="animate-fade-in">
          <div style={{ marginBottom: 16 }}>
            <label className="label">AI mặc định</label>
            <select className="select" style={{ maxWidth: 220 }} value={defaultProvider} onChange={e => setDefaultProvider(e.target.value)}>
              {AI_PROVIDERS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>

          {AI_PROVIDERS.map(provider => (
            <div key={provider.key} className="glass-card" style={{ marginBottom: 10 }}>
              <button onClick={() => setExpandedAI(expandedAI === provider.key ? null : provider.key)} style={{
                width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)',
              }}>
                <Key size={15} color="var(--brand-primary)" />
                <span style={{ fontWeight: 600, fontSize: 14, flex: 1, textAlign: 'left' }}>{provider.label}</span>
                {testResults[provider.key] && (
                  <span style={{ fontSize: 11, color: testResults[provider.key].ok ? '#10b981' : '#ef4444' }}>
                    {testResults[provider.key].msg}
                  </span>
                )}
                {expandedAI === provider.key ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {expandedAI === provider.key && (
                <div style={{ padding: '0 16px 16px' }}>
                  <div style={{ marginBottom: 10 }}>
                    <label className="label">API Key</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="input" placeholder={`Enter ${provider.label} API key`}
                        value={rawKeys[provider.keyField] || ''}
                        onChange={e => setRawKeys(p => ({ ...p, [provider.keyField]: e.target.value }))}
                      />
                      <button className="btn-secondary" onClick={() => handleTestKey(provider.key, provider.keyField)} disabled={testingKey === provider.key}
                        style={{ flexShrink: 0 }}>
                        {testingKey === provider.key ? <Loader2 size={13} className="animate-spin" /> : 'Test'}
                      </button>
                    </div>
                    {aiConfig[provider.keyField] && (
                      <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>Đã lưu: {aiConfig[provider.keyField]}</div>
                    )}
                  </div>
                  <div>
                    <label className="label">Model mặc định</label>
                    <select className="select" value={rawKeys[provider.modelField] || aiConfig[provider.modelField] || provider.models[0]}
                      onChange={e => setRawKeys(p => ({ ...p, [provider.modelField]: e.target.value }))}>
                      {provider.models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Nano Banana */}
          <div className="glass-card" style={{ marginBottom: 16, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              🍌 Nano Banana (Image Generator)
            </div>
            <label className="label">API Key</label>
            <input className="input" placeholder="nb_xxxxxxxx" value={rawKeys.nanoBananaKey || ''} onChange={e => setRawKeys(p => ({ ...p, nanoBananaKey: e.target.value }))} />
          </div>

          {testResults._saved && <div style={{ marginBottom: 12, color: '#10b981', fontSize: 13 }}>✅ Đã lưu cấu hình AI thành công!</div>}

          <button className="btn-primary" onClick={handleSaveAI} style={{ width: '100%', justifyContent: 'center' }}>
            <Save size={14} /> Lưu tất cả cấu hình AI
          </button>

          {/* Utility buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn-ghost" onClick={() => invoke('settings:openUserData')} style={{ fontSize: 12 }}>
              <FolderOpen size={13} /> Mở thư mục data
            </button>
            <button className="btn-ghost" onClick={() => invoke('settings:openThumbnailDir')} style={{ fontSize: 12 }}>
              <FolderOpen size={13} /> Thư mục Thumbnails
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
