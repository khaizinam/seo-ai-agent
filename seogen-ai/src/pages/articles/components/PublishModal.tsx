import { useState, useEffect } from 'react'
import { invoke } from '../../../lib/api'
import { Webhook } from '../../../../electron/ipc/webhook.ipc'
import { Loader2, Send, Plus, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Props {
  open: boolean
  onClose: () => void
  articleId: number
}

export function PublishModal({ open, onClose, articleId }: Props) {
  const navigate = useNavigate()
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedWebhookId, setSelectedWebhookId] = useState<number | ''>('')
  const [publishing, setPublishing] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null)

  useEffect(() => {
    if (open) {
      loadWebhooks()
      setResult(null)
    }
  }, [open])

  const loadWebhooks = async () => {
    setLoading(true)
    try {
      const list = await invoke<Webhook[]>('webhook:list')
      const active = list.filter(w => w.status === 'active')
      setWebhooks(active)
      if (active.length > 0) setSelectedWebhookId(active[0].id)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!selectedWebhookId) return
    setPublishing(true)
    setResult(null)
    try {
      const res = await invoke<{ success: boolean; error?: string; status?: number; data?: any }>('webhook:publish', {
        webhookId: +selectedWebhookId,
        articleId
      })
      if (res.success) {
        setResult({ 
          success: true, 
          message: `Thành công! Status: ${res.status}`,
          data: res.data
        })
      } else {
        setResult({ 
          success: false, 
          message: res.error || 'Lỗi không xác định' 
        })
      }
    } catch (e: any) {
      setResult({ success: false, message: e.message })
    } finally {
      setPublishing(false)
    }
  }

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 500, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Cập nhật lên trang (Publish)</h3>
          <button className="btn-ghost" onClick={onClose} style={{ padding: 4 }}><X size={20} /></button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {loading ? (
            <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}><Loader2 size={24} className="animate-spin" color="var(--brand-primary)" /></div>
          ) : webhooks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Bạn chưa có Webhook nào đang hoạt động.</p>
              <button 
                className="btn-primary" 
                style={{ margin: '0 auto' }}
                onClick={() => { onClose(); navigate('/webhook/create') }}
              >
                <Plus size={16} /> Tạo Webhook mới
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="label">Chọn Webhook Endpoint</label>
                <select 
                  className="select" 
                  value={selectedWebhookId} 
                  onChange={e => setSelectedWebhookId(+e.target.value)}
                  disabled={publishing}
                >
                  {webhooks.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.endpoint_url})</option>
                  ))}
                </select>
              </div>

              {result && (
                <div style={{ 
                  padding: 16, 
                  borderRadius: 8, 
                  background: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${result.success ? '#10b981' : '#ef4444'}`,
                  color: result.success ? '#10b981' : '#ef4444',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    {result.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {result.message}
                  </div>
                  {result.data && (
                    <div style={{ fontSize: 12, opacity: 0.8, maxHeight: 100, overflow: 'auto', background: 'rgba(0,0,0,0.1)', padding: 8, borderRadius: 4 }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn-secondary" onClick={onClose} disabled={publishing}>Đóng</button>
          {webhooks.length > 0 && (
            <button 
              className="btn-primary" 
              style={{ background: 'var(--brand-primary)', color: 'white' }}
              onClick={handlePublish}
              disabled={publishing || !selectedWebhookId}
            >
              {publishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {publishing ? 'Đang gửi...' : 'Gửi dữ liệu'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
