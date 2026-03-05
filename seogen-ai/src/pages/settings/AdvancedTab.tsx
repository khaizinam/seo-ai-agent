import { useState, useEffect } from 'react'
import { invoke } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'
import { AlertTriangle, RefreshCw, Loader2, Trash2, ShieldAlert, ZapOff, Users } from 'lucide-react'

export default function AdvancedTab() {
  const { setToast } = useAppStore()
  const [resetLoading, setResetLoading] = useState(false)
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [resetCountdown, setResetCountdown] = useState(0)

  // Cache & Session State
  const [cacheSize, setCacheSize] = useState<number | null>(null)
  const [cacheLoading, setCacheLoading] = useState(false)

  // Uninstall/Full Reset State
  const [showUninstallModal, setShowUninstallModal] = useState(false)
  const [keepSettings, setKeepSettings] = useState(true)

  // Persona states
  const [personas, setPersonas] = useState<{id: number; name: string}[]>([])
  const [defaultPersonaId, setDefaultPersonaId] = useState<string>('')
  const [showResetPersonaModal, setShowResetPersonaModal] = useState(false)
  const [personaResetLoading, setPersonaResetLoading] = useState(false)

  useEffect(() => {
    loadCacheSize()
    loadPersonas()
    // Load saved default persona
    invoke<any>('settings:getAll').then(res => {
      if (res?.defaultPersonaId) setDefaultPersonaId(String(res.defaultPersonaId))
    })
  }, [])

  const loadCacheSize = async () => {
    const res = await invoke<{ success: boolean, size: number }>('app:getCacheSize')
    if (res.success) setCacheSize(res.size)
  }

  const handleClearCache = async () => {
    setCacheLoading(true)
    await invoke('app:clearCache')
    await loadCacheSize()
    setCacheLoading(false)
    alert('Đã dọn dẹp bộ nhớ đệm và các phiên làm việc thành công!')
  }

  const handleResetDB = async () => {
    setResetLoading(true)
    const res = await invoke<{ success: boolean; message: string }>('db:reset')
    if (res.success) {
      alert(res.message)
      setShowConfirmReset(false)
    } else {
      alert(res.message)
    }
    setResetLoading(false)
  }

  const handleFullCleanup = async () => {
    setResetLoading(true)
    const res = await invoke<{ success: boolean, error?: string }>('app:fullCleanup', { keepSettings })
    if (res.success) {
      alert('Đã dọn dẹp hệ thống thành công. Ứng dụng sẽ khởi động lại.')
      window.location.reload()
    } else {
      alert('Lỗi: ' + res.error)
    }
    setResetLoading(false)
    setShowUninstallModal(false)
  }

  const startResetFlow = () => {
    setShowConfirmReset(true)
    setResetCountdown(5)
    const timer = setInterval(() => {
      setResetCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Persona helpers
  const loadPersonas = async () => {
    const list = await invoke<{id: number; name: string}[]>('persona:list')
    setPersonas(list || [])
  }

  const handleDefaultPersonaChange = async (id: string) => {
    setDefaultPersonaId(id)
    await invoke('settings:set', { key: 'defaultPersonaId', value: id })
    setToast({ message: 'Đã cập nhật giọng văn mặc định', type: 'success' })
  }

  const handleResetPersonas = async () => {
    setPersonaResetLoading(true)
    try {
      const res = await invoke<{success: boolean; count?: number; error?: string}>('persona:resetToDefaults')
      if (res.success) {
        setToast({ message: `Đã reset và seed lại ${res.count} giọng văn mặc định`, type: 'success' })
        await loadPersonas()
        setDefaultPersonaId('')
      } else {
        setToast({ message: res.error || 'Lỗi khi reset', type: 'error' })
      }
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setPersonaResetLoading(false)
      setShowResetPersonaModal(false)
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Persona / Writing Style Settings */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} color="var(--brand-primary)" /> Giọng văn / Persona
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Chọn giọng văn mặc định khi tạo bài viết. Bạn có thể reset về 20 giọng văn gốc.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label className="label">Giọng văn mặc định</label>
            <select
              className="select"
              value={defaultPersonaId}
              onChange={e => handleDefaultPersonaChange(e.target.value)}
            >
              <option value="">-- Không chọn --</option>
              {personas.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Reset giọng văn về mặc định</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Xóa toàn bộ giọng văn hiện tại và khôi phục lại 20 giọng văn gốc.
              </div>
            </div>
            <button
              className="btn-secondary"
              style={{ fontSize: 12, borderColor: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b' }}
              onClick={() => setShowResetPersonaModal(true)}
            >
              <RefreshCw size={13} /> Reset Personas
            </button>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8 }}>
            Hiện có <strong>{personas.length}</strong> giọng văn trong hệ thống.
          </div>
        </div>
      </div>

      {/* Cache Settings */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trash2 size={18} color="var(--brand-primary)" /> Quản lý bộ nhớ đệm
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Dọn dẹp cache hình ảnh, file tạm và các phiên làm việc để giải phóng dung lượng và làm mới ứng dụng.
        </p>

        <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Dung lượng cache hiện tại</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {cacheSize !== null ? formatSize(cacheSize) : '...'}
            </div>
          </div>
          <button className="btn-secondary" onClick={handleClearCache} disabled={cacheLoading}>
            {cacheLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Giải phóng bộ nhớ
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)' }}>
          <AlertTriangle size={18} /> Vùng nguy hiểm
        </h2>
        
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          Các thao tác dưới đây sẽ ảnh hưởng trực tiếp đến dữ liệu và cấu hình hệ thống.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Reset DB */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Cấu hình lại Database (Factory Reset)</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Xóa toàn bộ các bảng và khởi tạo lại từ đầu. <span style={{ color: 'var(--danger)' }}>Dữ liệu sẽ bị mất vĩnh viễn!</span>
              </div>
            </div>
            {!showConfirmReset ? (
              <button className="btn-danger" onClick={startResetFlow} style={{ fontSize: 12 }}>
                <RefreshCw size={13} /> Reset Database
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-ghost" onClick={() => setShowConfirmReset(false)} style={{ fontSize: 12 }}>Hủy</button>
                <button 
                  className="btn-danger" 
                  onClick={handleResetDB} 
                  disabled={resetCountdown > 0 || resetLoading}
                  style={{ minWidth: 120, fontSize: 12 }}
                >
                  {resetLoading ? <Loader2 size={13} className="animate-spin" /> : (resetCountdown > 0 ? `${resetCountdown}s` : 'Xác nhận xóa!')}
                </button>
              </div>
            )}
          </div>

          {/* Uninstall/Full Reset */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Gỡ cài đặt / Reset toàn bộ ứng dụng</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Xóa cache file rác, thumbnails và tùy chọn gỡ bỏ cài đặt cá nhân.
              </div>
            </div>
            <button className="btn-danger" onClick={() => setShowUninstallModal(true)} style={{ fontSize: 12 }}>
              <ZapOff size={13} /> Gỡ cài đặt / Reset
            </button>
          </div>
        </div>
      </div>

      {/* Uninstall Modal */}
      {showUninstallModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass-card animate-scale-in" style={{ maxWidth: 460, padding: 32, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <ShieldAlert size={32} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Xác nhận dọn dẹp hệ thống?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              Hành động này sẽ xóa toàn bộ bộ nhớ đệm, các phiên đăng nhập và tệp rác tạm thời.
            </p>

            <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 12, marginBottom: 24, textAlign: 'left' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={keepSettings} 
                  onChange={e => setKeepSettings(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--brand-primary)' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Giữ lại cài đặt cá nhân</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Giữ lại API Keys, Cấu hình DB, App Theme...</div>
                </div>
              </label>
              {!keepSettings && (
                <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: 12, display: 'flex', gap: 8 }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  <span>CẢNH BÁO: Toàn bộ API Key và cấu hình của bạn sẽ bị xoá sạch!</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowUninstallModal(false)}>Hủy bỏ</button>
              <button 
                className="btn-danger" 
                style={{ flex: 1, justifyContent: 'center' }} 
                onClick={handleFullCleanup}
                disabled={resetLoading}
              >
                {resetLoading ? <Loader2 size={16} className="animate-spin" /> : 'Xác nhận thực hiện'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persona Reset Confirm Modal */}
      {showResetPersonaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass-card animate-scale-in" style={{ maxWidth: 440, padding: 32, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <AlertTriangle size={32} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Reset giọng văn?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              Hành động này sẽ <strong style={{ color: '#ef4444' }}>xóa toàn bộ giọng văn</strong> mà bạn đã tạo và khôi phục lại 20 giọng văn mặc định ban đầu.
              <br /><br />
              <strong>Dữ liệu giọng văn tùy chỉnh sẽ bị mất vĩnh viễn!</strong>
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowResetPersonaModal(false)}>Hủy bỏ</button>
              <button 
                className="btn-danger" 
                style={{ flex: 1, justifyContent: 'center' }} 
                onClick={handleResetPersonas}
                disabled={personaResetLoading}
              >
                {personaResetLoading ? <Loader2 size={16} className="animate-spin" /> : 'Xác nhận Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

