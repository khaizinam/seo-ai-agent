import { X } from 'lucide-react'
import { useEffect } from 'react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

const VARIANT_STYLE = {
  danger:  { icon: '🗑️', color: '#ef4444', btnClass: 'btn-danger' },
  warning: { icon: '⚠️', color: '#f59e0b', btnClass: 'btn-secondary' },
  info:    { icon: 'ℹ️', color: '#06b6d4', btnClass: 'btn-secondary' },
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy',
  variant = 'danger', onConfirm, onCancel, loading = false
}: ConfirmDialogProps) {
  const style = VARIANT_STYLE[variant]

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: 400, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{style.icon}</div>
        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn-ghost" onClick={onCancel} style={{ minWidth: 90 }} disabled={loading}>{cancelLabel}</button>
          <button className={style.btnClass} onClick={onConfirm} style={{ minWidth: 120 }} disabled={loading}>
            {loading ? <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
