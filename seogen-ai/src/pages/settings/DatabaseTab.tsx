import { useState, useEffect } from 'react'
import { invoke } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'
import {
  Database, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Pencil, Server, User, Globe
} from 'lucide-react'

const DB_TYPES = [
  { value: 'sqlite', label: 'SQLite (Local File)', defaultPort: 0 },
  { value: 'mysql', label: 'MySQL', defaultPort: 3306 },
  { value: 'mariadb', label: 'MariaDB', defaultPort: 3306 },
  { value: 'postgresql', label: 'PostgreSQL', defaultPort: 5432 },
]

export default function DatabaseTab() {
  const { dbConnected, setDbConnected, setToast } = useAppStore()
  const [editing, setEditing] = useState(false)

  const [dbType, setDbType] = useState('sqlite')
  const [dbHost, setDbHost] = useState('localhost')
  const [dbPort, setDbPort] = useState(0)
  const [dbName, setDbName] = useState('seogen_ai')
  const [dbUser, setDbUser] = useState('root')
  const [dbPass, setDbPass] = useState('')
  const [dbSsl, setDbSsl] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [dbStatus, setDbStatus] = useState<{ ok?: boolean; msg?: string } | null>(null)
  const [dbLoading, setDbLoading] = useState(false)
  const [dbHistory, setDbHistory] = useState<Record<string, any>>({})

  // Settings Sync States
  const [showSyncModal, setShowSyncModal] = useState<'upload' | 'download' | null>(null)
  const [profiles, setProfiles] = useState<any[]>([])
  const [profilesLoading, setProfilesLoading] = useState(false)
  const [selectedProfileId, setSelectedProfileId] = useState<number | ''>('')
  const [newProfileName, setNewProfileName] = useState('')
  const [isOverwrite, setIsOverwrite] = useState(false)

  useEffect(() => {
    invoke<{
      current: {
        host?: string; port?: number; database?: string; user?: string;
        password?: string; type?: string; ssl?: boolean
      } | null;
      history: Record<string, any>;
    } | null>('db:getConfig').then(res => {
      if (res) {
        setDbHistory(res.history || {})
        const cfg = res.current
        if (cfg) {
          setDbType(cfg.type || 'sqlite')
          setDbHost(cfg.host || 'localhost')
          setDbPort(cfg.port || 0)
          setDbName(cfg.database || 'seogen_ai')
          setDbUser(cfg.user || 'root')
          setDbPass(cfg.password || '')
          setDbSsl(cfg.ssl || false)
        }
      }
    })
  }, [])

  // Auto-show form if DB is not connected
  useEffect(() => {
    if (!dbConnected) setEditing(true)
  }, [dbConnected])

  async function handleDbConnect() {
    setDbLoading(true); setDbStatus(null)
    const res = await invoke<{ success: boolean; message: string }>('db:connect', {
      type: dbType, host: dbHost, port: dbPort, database: dbName, user: dbUser, password: dbPass, ssl: dbSsl
    })
    setDbStatus({ ok: res.success, msg: res.message })
    setDbConnected(res.success)
    if (res.success) {
      setEditing(false) // Close form on success
      // Save current configuration to local history state
      setDbHistory(prev => ({
        ...prev,
        [dbType]: { type: dbType, host: dbHost, port: dbPort, database: dbName, user: dbUser, password: dbPass, ssl: dbSsl }
      }))
    }
    setDbLoading(false)
  }

  const [syncLoading, setSyncLoading] = useState(false)

  async function handleSync(direction: 'push' | 'pull') {
    const isPush = direction === 'push'
    const confirmMessage = isPush 
      ? '⚠️ CẢNH BÁO CỰC KỲ QUAN TRỌNG:\nHành động này sẽ XÓA TOÀN BỘ dữ liệu hiện tại trên Cloud Database (MySQL/MariaDB/Postgres) và GHI ĐÈ bằng dữ liệu SQLite từ máy bạn.\n\nBạn có chắc chắn muốn đồng bộ lên Cloud không?'
      : '⚠️ CẢNH BÁO CỰC KỲ QUAN TRỌNG:\nHành động này sẽ XÓA TOÀN BỘ dữ liệu SQLite cục bộ trên máy tính này và TẢI/GHI ĐÈ toàn bộ dữ liệu từ Cloud Database về.\n\nBạn có chắc chắn muốn đồng bộ xuống SQLite không?'
    
    if (!window.confirm(confirmMessage)) return

    setSyncLoading(true)
    try {
      const res = await invoke<{ success: boolean; message: string }>('db:sync', direction)
      if (res.success) {
        setToast({ message: res.message, type: 'success' })
      } else {
        setToast({ message: res.message, type: 'error' })
      }
    } catch (e: any) {
      setToast({ message: 'Lỗi: ' + e.message, type: 'error' })
    } finally {
      setSyncLoading(false)
    }
  }

  async function openSyncModal(type: 'upload' | 'download') {
    setShowSyncModal(type)
    setProfilesLoading(true)
    setIsOverwrite(false)
    setSelectedProfileId('')
    setNewProfileName('')
    
    try {
      const res = await invoke<{ success: boolean; profiles: any[]; error?: string }>('db:listConfigProfiles')
      if (res.success) {
        setProfiles(res.profiles)
      } else {
        setToast({ message: res.error || 'Lỗi tải danh sách cấu hình', type: 'error' })
      }
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setProfilesLoading(false)
    }
  }

  async function handleSaveProfile() {
    if (isOverwrite && !selectedProfileId) return
    if (!isOverwrite && !newProfileName.trim()) return

    const name = isOverwrite 
      ? (profiles.find(p => p.id === selectedProfileId)?.profile_name || '') 
      : newProfileName.trim()

    setProfilesLoading(true)
    try {
      const res = await invoke<{ success: boolean; message?: string; error?: string }>('db:saveConfigProfile', {
        profileName: name,
        overwriteId: isOverwrite ? (selectedProfileId as number) : undefined
      })
      if (res.success) {
        setToast({ message: res.message || 'Đồng bộ cấu hình thành công!', type: 'success' })
        setShowSyncModal(null)
      } else {
        setToast({ message: res.error || 'Lỗi lưu cấu hình', type: 'error' })
      }
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setProfilesLoading(false)
    }
  }

  async function handleLoadProfile() {
    if (!selectedProfileId) return
    
    const profileName = profiles.find(p => p.id === selectedProfileId)?.profile_name || ''
    if (!window.confirm(`Bạn có chắc chắn muốn tải cấu hình "${profileName}" về? Toàn bộ cấu hình AI Model Keys, Theme của máy tính này sẽ bị ghi đè.`)) return

    setProfilesLoading(true)
    try {
      const res = await invoke<{ success: boolean; message?: string; error?: string }>('db:loadConfigProfile', selectedProfileId)
      if (res.success) {
        alert(res.message)
        setShowSyncModal(null)
        window.location.reload()
      } else {
        setToast({ message: res.error || 'Lỗi tải cấu hình', type: 'error' })
      }
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setProfilesLoading(false)
    }
  }

  const dbTypeLabel = DB_TYPES.find(d => d.value === dbType)?.label || dbType

  // ─── Render View ───
  return (
    <>
      {dbConnected && !editing ? (
        <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={16} color="var(--brand-primary)" /> Kết nối Database
            </h2>
            <button className="btn-secondary" onClick={() => setEditing(true)} style={{ fontSize: 12 }}>
              <Pencil size={13} /> Chỉnh sửa
            </button>
          </div>

          {/* Status badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
            padding: '10px 14px', borderRadius: 8,
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
          }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>Đang kết nối</span>
          </div>

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <InfoItem icon={<Server size={14} />} label="Loại Database" value={dbTypeLabel} />
            <InfoItem icon={<Globe size={14} />} label="Host" value={`${dbHost}:${dbPort}`} />
            <InfoItem icon={<Database size={14} />} label="Database" value={dbName} />
            <InfoItem icon={<User size={14} />} label="User" value={dbUser} />
          </div>

          {dbType !== 'sqlite' && (
            <>
              <div style={{
                marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: 12
              }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔄 Đồng bộ dữ liệu (Data Sync)
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Bạn đang kết nối với cơ sở dữ liệu Cloud. Bạn có thể thực hiện đồng bộ dữ liệu giữa file SQLite cá nhân cục bộ và Cloud database.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    className="btn-secondary" 
                    style={{ flex: 1, fontSize: 12, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }} 
                    onClick={() => handleSync('push')}
                    disabled={syncLoading}
                  >
                    {syncLoading ? <Loader2 size={13} className="animate-spin" /> : '📤 Đồng bộ lên Cloud'}
                  </button>
                  <button 
                    className="btn-secondary" 
                    style={{ flex: 1, fontSize: 12, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }} 
                    onClick={() => handleSync('pull')}
                    disabled={syncLoading}
                  >
                    {syncLoading ? <Loader2 size={13} className="animate-spin" /> : '📥 Đồng bộ xuống SQLite'}
                  </button>
                </div>
              </div>

              <div style={{
                marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: 12
              }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  ⚙️ Đồng bộ cấu hình cài đặt (Settings Sync)
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Lưu trữ cấu hình model AI và cài đặt cá nhân của bạn lên Cloud DB để dễ dàng dùng chung trên máy tính khác.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    className="btn-secondary" 
                    style={{ flex: 1, fontSize: 12, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }} 
                    onClick={() => openSyncModal('upload')}
                    disabled={syncLoading}
                  >
                    📤 Tải cấu hình lên Cloud
                  </button>
                  <button 
                    className="btn-secondary" 
                    style={{ flex: 1, fontSize: 12, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }} 
                    onClick={() => openSyncModal('download')}
                    disabled={syncLoading}
                  >
                    📥 Tải cấu hình từ Cloud về
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={16} color="var(--brand-primary)" /> Kết nối Database
            </h2>
            {dbConnected && (
              <button className="btn-ghost" onClick={() => setEditing(false)} style={{ fontSize: 12 }}>
                ← Quay lại
              </button>
            )}
          </div>

          {/* DB Type */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 20 }}>
            {DB_TYPES.map(d => (
              <button key={d.value} onClick={() => {
                setDbType(d.value)
                // Populate form with history for this type if available, else default values
                const hist = dbHistory[d.value]
                if (hist) {
                  setDbHost(hist.host || 'localhost')
                  setDbPort(hist.port || d.defaultPort)
                  setDbName(hist.database || 'seogen_ai')
                  setDbUser(hist.user || 'root')
                  setDbPass(hist.password || '')
                  setDbSsl(hist.ssl || false)
                } else {
                  setDbHost('localhost')
                  setDbPort(d.defaultPort)
                  setDbName('seogen_ai')
                  setDbUser('root')
                  setDbPass('')
                  setDbSsl(false)
                }
              }} style={{
                padding: '10px 8px', borderRadius: 8, border: `1px solid ${dbType === d.value ? 'var(--brand-primary)' : 'var(--border)'}`,
                background: dbType === d.value ? 'rgba(99,102,241,0.12)' : 'var(--surface-2)',
                color: dbType === d.value ? 'var(--brand-primary)' : 'var(--text-secondary)',
                cursor: 'pointer', fontWeight: dbType === d.value ? 600 : 400, fontSize: 13, transition: 'all 0.15s',
              }}>{d.label}</button>
            ))}
          </div>

          {dbType !== 'sqlite' ? (
            <>
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
            </>
          ) : (
            <div style={{
              marginBottom: 20, padding: '14px', borderRadius: 8,
              background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)',
              color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6
            }}>
              💡 <strong>SQLite (Local File)</strong> là cơ sở dữ liệu dạng tệp lưu trực tiếp trên máy tính của bạn. Không cần cài đặt máy chủ DB, không cần cấu hình mật khẩu. Rất phù hợp để bắt đầu nhanh. Dữ liệu sẽ được tự động tạo tại thư mục lưu trữ của ứng dụng.
            </div>
          )}

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

      {/* Settings Sync Modal */}
      {showSyncModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass-card animate-scale-in" style={{ maxWidth: 440, width: '100%', padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              🔄 {showSyncModal === 'upload' ? 'Đồng bộ cấu hình LÊN Cloud' : 'Tải cấu hình TỪ Cloud về'}
            </h3>
            
            {profilesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                <Loader2 className="animate-spin" size={24} color="var(--brand-primary)" />
              </div>
            ) : (
              <div>
                {showSyncModal === 'upload' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      Đồng bộ toàn bộ cấu hình AI Model Keys, Theme, Ngôn ngữ lên Cloud DB để dùng chung cho các máy tính khác.
                    </p>
                    
                    {profiles.length > 0 && (
                      <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                          <input 
                            type="checkbox" 
                            checked={isOverwrite} 
                            onChange={e => setIsOverwrite(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          Ghi đè cấu hình cũ đang có trên Cloud
                        </label>
                      </div>
                    )}

                    {isOverwrite && profiles.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label className="label">Chọn cấu hình để ghi đè</label>
                        <select 
                          className="select" 
                          value={selectedProfileId} 
                          onChange={e => {
                            const val = +e.target.value
                            setSelectedProfileId(val)
                            const found = profiles.find(p => p.id === val)
                            if (found) setNewProfileName(found.profile_name)
                          }}
                        >
                          <option value="">-- Chọn cấu hình --</option>
                          {profiles.map(p => (
                            <option key={p.id} value={p.id}>{p.profile_name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label className="label">Tên cấu hình mới</label>
                        <input 
                          className="input" 
                          value={newProfileName} 
                          onChange={e => setNewProfileName(e.target.value)} 
                          placeholder="Ví dụ: Máy nhà, Máy văn phòng..."
                        />
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                      <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowSyncModal(null)}>Hủy</button>
                      <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSaveProfile} disabled={isOverwrite ? !selectedProfileId : !newProfileName.trim()}>
                        📤 Lưu lên Cloud
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      Chọn một cấu hình đã lưu trên Cloud DB để tải về đồng bộ cho máy tính này.
                    </p>
                    
                    {profiles.length === 0 ? (
                      <div style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: 8, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        📭 Không tìm thấy cấu hình nào trên Cloud DB.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label className="label">Chọn cấu hình tải về</label>
                        <select 
                          className="select" 
                          value={selectedProfileId} 
                          onChange={e => setSelectedProfileId(+e.target.value)}
                        >
                          <option value="">-- Chọn cấu hình --</option>
                          {profiles.map(p => (
                            <option key={p.id} value={p.id}>{p.profile_name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                      <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowSyncModal(null)}>Hủy</button>
                      <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleLoadProfile} disabled={!selectedProfileId}>
                        📥 Tải về &amp; Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Small info display component ───
function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 10,
      background: 'var(--surface-2)', border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--text-muted)', fontSize: 11 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}
