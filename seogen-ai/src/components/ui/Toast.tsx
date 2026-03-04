import { useAppStore } from '../../stores/app.store'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export function Toast() {
  const { toast, setToast } = useAppStore()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (toast) {
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [toast])

  if (!toast) return null

  const bg = toast.type === 'success' ? 'var(--success-bg, #065f46)' : 'var(--danger-bg, #991b1b)'
  const border = toast.type === 'success' ? 'var(--success-border, #10b981)' : 'var(--danger-border, #ef4444)'
  const Icon = toast.type === 'success' ? CheckCircle2 : AlertCircle

  return (
    <div style={{
      position: 'fixed',
      bottom: 40,
      right: 40,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 20px',
      borderRadius: 12,
      background: 'var(--surface-1, #1e293b)',
      border: `1px solid ${border}`,
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      color: 'var(--text-primary, white)',
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      pointerEvents: visible ? 'all' : 'none',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: border, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={14} color="white" />
      </div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{toast.message}</div>
      <button 
        onClick={() => setToast(null)}
        style={{ 
          background: 'none', border: 'none', color: 'var(--text-muted)', 
          cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' 
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}
