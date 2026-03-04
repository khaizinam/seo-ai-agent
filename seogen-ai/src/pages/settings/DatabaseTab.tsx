import { useState, useEffect } from 'react'
import { invoke } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'
import {
  Database, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Pencil, Server, User, Globe
} from 'lucide-react'

const DB_TYPES = [
  { value: 'mysql', label: 'MySQL', defaultPort: 3306 },
  { value: 'mariadb', label: 'MariaDB', defaultPort: 3306 },
  { value: 'postgresql', label: 'PostgreSQL', defaultPort: 5432 },
]

export default function DatabaseTab() {
  const { dbConnected, setDbConnected } = useAppStore()
  const [editing, setEditing] = useState(false)

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

  useEffect(() => {
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
    }
    setDbLoading(false)
  }

  const dbTypeLabel = DB_TYPES.find(d => d.value === dbType)?.label || dbType

  // ─── Connected Summary View ───
  if (dbConnected && !editing) {
    return (
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
      </div>
    )
  }

  // ─── Edit Form View ───
  return (
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
