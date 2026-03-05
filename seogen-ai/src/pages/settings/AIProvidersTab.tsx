import { useState, useEffect } from 'react'
import { invoke } from '../../lib/api'
import {
  Key, ChevronDown, ChevronUp, Loader2, FolderOpen, Save, 
  Plus, Edit2, Trash2, CheckCircle2, XCircle, Zap, X, RefreshCw, AlertTriangle
} from 'lucide-react'

const AI_PROVIDERS = [
  { key: 'gemini', label: 'Google Gemini', placeholder: 'gemini-2.5-flash' },
  { key: 'claude', label: 'Anthropic Claude', placeholder: 'claude-3-7-sonnet-20250219' },
  { key: 'copilot', label: 'OpenAI / Copilot', placeholder: 'gpt-4o' },
]

const PREDEFINED_MODELS: Record<string, {value: string, label: string}[]> = {
  gemini: [
    // free plan tier
    { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite - free' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash - free' },
    { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite - free' },
    { value: 'gemini-3.0-flash', label: 'Gemini 3 Flash - free' },
    // paid plan tier
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2 Flash' },
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2 Flash Exp' },
    { value: 'gemini-2.0-flash-lite', label: 'Gemini 2 Flash Lite' },
    { value: 'gemini-3.0-pro', label: 'Gemini 3 Pro' },
    { value: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro' },
  ],
  claude: [
    { value: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet - Mới nhất' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku - Nhanh / Rẻ' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus - Chuyên sâu' }
  ],
  copilot: [
    { value: 'gpt-4o', label: 'GPT-4o - Đa năng / Tiêu chuẩn' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini - Nhanh / Rẻ' },
    { value: 'o3-mini', label: 'o3-mini - Suy luận nhanh' },
    { value: 'o1', label: 'o1 - Suy luận phức tạp' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' }
  ]
}

interface AIProfile {
  id: string
  name: string
  provider: string
  model: string
  apiKey: string
  active: boolean
}

export default function AIProvidersTab() {
  const [profiles, setProfiles] = useState<AIProfile[]>([])
  const [editingProfile, setEditingProfile] = useState<AIProfile | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const [autoSwitch, setAutoSwitch] = useState(false)
  const [exhaustedIds, setExhaustedIds] = useState<string[]>([])

  // Legacy state
  const [aiConfig, setAiConfig] = useState<any>({})
  const [expandedAI, setExpandedAI] = useState<string | null>(null)
  const [rawKeys, setRawKeys] = useState<Record<string, string>>({})

  const load = async () => {
    const cfg = await invoke<any | null>('ai:getConfig')
    if (cfg) {
      setAiConfig(cfg)
      setProfiles(cfg.profiles || [])
      setRawKeys({
        geminiKey: cfg.geminiKey || '',
        claudeKey: cfg.claudeKey || '',
        copilotKey: cfg.copilotKey || '',
        nanoBananaKey: cfg.nanoBananaKey || '',
        geminiModel: cfg.geminiModel || '',
        claudeModel: cfg.claudeModel || '',
        copilotModel: cfg.copilotModel || '',
      })
    }
    // Load auto-switch setting
    const settings = await invoke<any>('settings:getAll')
    if (settings) setAutoSwitch(!!settings.autoSwitchModel)
    // Load exhausted profiles
    const exh = await invoke<string[]>('ai:getExhaustedProfiles')
    if (exh) setExhaustedIds(exh)
  }

  useEffect(() => { load() }, [])

  const handleToggleAutoSwitch = async (val: boolean) => {
    setAutoSwitch(val)
    await invoke('settings:set', { key: 'autoSwitchModel', value: val })
  }

  const handleClearExhausted = async () => {
    await invoke('ai:clearExhaustedProfiles')
    setExhaustedIds([])
  }

  const handleOpenAdd = () => {
    setEditingProfile({
      id: Date.now().toString(),
      name: `AI Profile ${profiles.length + 1}`,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      apiKey: '',
      active: profiles.length === 0
    })
    setTestResult(null)
    setShowModal(true)
  }

  const handleOpenEdit = (profile: AIProfile) => {
    setEditingProfile({ ...profile })
    setTestResult(null)
    setShowModal(true)
  }

  const handleActivate = async (id: string) => {
    const updated = profiles.map(p => ({ ...p, active: p.id === id }))
    setProfiles(updated)
    await saveAll(updated)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xoá profile này?')) return
    const updated = profiles.filter(p => p.id !== id)
    setProfiles(updated)
    await saveAll(updated)
  }

  const handleTestKeyInModal = async () => {
    if (!editingProfile?.apiKey || !editingProfile?.provider) return
    setTesting(true)
    const res = await invoke<{ success: boolean; message: string }>('ai:testKey', { 
      provider: editingProfile.provider, 
      key: editingProfile.apiKey 
    })
    setTestResult({ ok: res.success, msg: res.message })
    setTesting(false)
  }

  const handleSaveProfile = async () => {
    if (!editingProfile) return
    let updated: AIProfile[]
    if (profiles.find(p => p.id === editingProfile.id)) {
      updated = profiles.map(p => p.id === editingProfile.id ? editingProfile : p)
    } else {
      updated = [...profiles, editingProfile]
    }
    
    // If this profile is active, deactivate others
    if (editingProfile.active) {
      updated = updated.map(p => ({ ...p, active: p.id === editingProfile.id }))
    }

    setProfiles(updated)
    await saveAll(updated)
    setShowModal(false)
  }

  const saveAll = async (currentProfiles: AIProfile[]) => {
    setLoading(true)
    const merged = { 
      ...aiConfig, 
      ...rawKeys, 
      profiles: currentProfiles,
    }
    await invoke('settings:saveAiConfig', merged)
    await invoke('ai:saveConfig', merged)
    setLoading(false)
  }

  const handleSaveLegacy = async () => {
    await saveAll(profiles)
    alert('Đã lưu cấu hình legacy thành công!')
  }

    return (
    <div className="animate-fade-in">
      {/* Auto-switch toggle bar */}
      <div className="glass-card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Auto-switch khi hết limit</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tự động xoay sang AI khác khi bị rate limit</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {exhaustedIds.length > 0 && (
            <button className="btn-ghost" style={{ fontSize: 11, color: '#f59e0b', gap: 4 }} onClick={handleClearExhausted}>
              <RefreshCw size={12} /> Reset trạng thái ({exhaustedIds.length})
            </button>
          )}
          <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
            <input type="checkbox" checked={autoSwitch} onChange={e => handleToggleAutoSwitch(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{
              position: 'absolute', inset: 0, borderRadius: 12,
              background: autoSwitch ? '#6366f1' : 'var(--surface-3)',
              transition: 'all 0.3s ease',
            }}>
              <span style={{
                position: 'absolute', width: 18, height: 18, borderRadius: '50%',
                background: 'white', top: 3,
                left: autoSwitch ? 23 : 3,
                transition: 'all 0.3s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </span>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Danh sách AI API</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Quản lý các cấu hình AI của bạn trong dạng bảng.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd} disabled={profiles.length >= 10}>
          <Plus size={14} /> Thêm AI mới
        </button>
      </div>

      {/* Profiles Table */}
      <div className="glass-card" style={{ overflow: 'hidden', marginBottom: 30 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Active</th>
              <th>Tên cấu hình</th>
              <th>Provider</th>
              <th>Model</th>
              <th style={{ width: 140, textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Chưa có cấu hình nào. Nhấn "Thêm AI mới" để bắt đầu.
                </td>
              </tr>
            ) : (
              profiles.map(p => (
                <tr key={p.id}>
                  <td style={{ textAlign: 'center' }}>
                    <div 
                      onClick={() => !p.active && handleActivate(p.id)}
                      style={{ 
                        cursor: p.active ? 'default' : 'pointer',
                        color: p.active ? 'var(--brand-primary)' : 'var(--text-muted)',
                        display: 'flex', justifyContent: 'center'
                      }}
                    >
                      {p.active ? <CheckCircle2 size={18} /> : <XCircle size={18} style={{ opacity: 0.3 }} />}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                  </td>
                  <td>
                    <span className="badge badge-info">{AI_PROVIDERS.find(ap => ap.key === p.provider)?.label || p.provider}</span>
                  </td>
                  <td>
                    <code style={{ fontSize: 11, background: 'var(--surface-3)', padding: '2px 6px', borderRadius: 4 }}>{p.model}</code>
                    {exhaustedIds.includes(p.id) && (
                      <span style={{ marginLeft: 8, fontSize: 10, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                        ⚠ Hết limit
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {!p.active && (
                        <button className="btn-ghost" onClick={() => handleActivate(p.id)} title="Kích hoạt">
                          <Zap size={14} />
                        </button>
                      )}
                      <button className="btn-ghost" onClick={() => handleOpenEdit(p)} title="Sửa">
                        <Edit2 size={14} />
                      </button>
                      <button className="btn-ghost" onClick={() => handleDelete(p.id)} style={{ color: 'var(--danger)' }} title="Xoá">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legacy & Utilities */}
      <div style={{ height: 1, background: 'var(--border)', margin: '24px 0' }} />
      
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Cấu hình dự phòng & Tiện ích</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Nano Banana */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            🍌 Nano Banana (Thumbnail API)
          </div>
          <input className="input" placeholder="nb_xxxxxxxx" 
            value={rawKeys.nanoBananaKey || ''} 
            onChange={e => setRawKeys(p => ({ ...p, nanoBananaKey: e.target.value }))} 
          />
          <button className="btn-primary" onClick={handleSaveLegacy} style={{ width: '100%', marginTop: 12, fontSize: 12 }}>
            Lưu Nano Key
          </button>
        </div>

        {/* Directory links */}
        <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
           <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Thư mục hệ thống</div>
           <button className="btn-secondary" onClick={() => invoke('settings:openUserData')} style={{ justifyContent: 'flex-start', fontSize: 12 }}>
            <FolderOpen size={13} /> Mở thư mục User Data
          </button>
          <button className="btn-secondary" onClick={() => invoke('settings:openThumbnailDir')} style={{ justifyContent: 'flex-start', fontSize: 12 }}>
            <FolderOpen size={13} /> Thư mục Thumbnails
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && editingProfile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: 500, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-1)' }}>
              <h3 style={{ fontWeight: 700, fontSize: 15 }}>{profiles.find(p => p.id === editingProfile.id) ? 'Chỉnh sửa AI' : 'Thêm AI mới'}</h3>
              <button className="btn-ghost" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Tên cấu hình</label>
                <input className="input" value={editingProfile.name} onChange={e => setEditingProfile({ ...editingProfile, name: e.target.value })} placeholder="VD: Gemini Work" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Provider</label>
                    <select className="select" value={editingProfile.provider} onChange={e => setEditingProfile({ 
                      ...editingProfile, 
                      provider: e.target.value,
                      model: AI_PROVIDERS.find(ap => ap.key === e.target.value)?.placeholder || ''
                    })}>
                      {AI_PROVIDERS.map(ap => <option key={ap.key} value={ap.key}>{ap.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Chọn Model mặc định</label>
                    <select className="select" 
                      value={PREDEFINED_MODELS[editingProfile.provider]?.find(m => m.value === editingProfile.model) ? editingProfile.model : 'custom'} 
                      onChange={e => {
                        if (e.target.value !== 'custom') {
                          setEditingProfile({ ...editingProfile, model: e.target.value })
                        }
                      }}
                    >
                      {PREDEFINED_MODELS[editingProfile.provider]?.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                      <option value="custom">-- Tùy chỉnh (Nhập bên dưới) --</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="label">Tên Model (Hoặc nhập mã Model thủ công nếu chọn Tùy chỉnh)</label>
                  <input className="input" value={editingProfile.model} onChange={e => setEditingProfile({ ...editingProfile, model: e.target.value })} 
                    placeholder={AI_PROVIDERS.find(ap => ap.key === editingProfile.provider)?.placeholder} />
                </div>
              </div>

              <div>
                <label className="label">API Key</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="input" type="password" value={editingProfile.apiKey} 
                    onChange={e => setEditingProfile({ ...editingProfile, apiKey: e.target.value })} 
                    placeholder="Mã API Key..." />
                  <button className="btn-secondary" onClick={handleTestKeyInModal} disabled={testing || !editingProfile.apiKey}>
                    {testing ? <Loader2 size={14} className="animate-spin" /> : 'Test'}
                  </button>
                </div>
                {testResult && (
                  <div style={{ marginTop: 8, fontSize: 12, color: testResult.ok ? '#10b981' : '#ef4444', display: 'flex', gap: 6, alignItems: 'center' }}>
                    {testResult.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {testResult.msg}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={editingProfile.active} onChange={e => setEditingProfile({ ...editingProfile, active: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: 'var(--brand-primary)' }} />
                  Đặt làm AI mặc định ngay khi lưu
                </label>
              </div>
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'var(--surface-1)' }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn-primary" onClick={handleSaveProfile} disabled={!editingProfile.name || !editingProfile.apiKey}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
