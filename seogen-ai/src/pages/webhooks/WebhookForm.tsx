import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react'
import { invoke } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'

interface Header {
  key: string
  value: string
}

interface BodyField {
  key: string
  type: 'manual' | 'field'
  value: string
}

const FIELD_OPTIONS = [
  { value: 'title', label: 'Tiêu đề bài viết' },
  { value: 'content_html', label: 'Nội dung (HTML)' },
  { value: 'content_text', label: 'Nội dung (Text thuần)' },
  { value: 'meta_title', label: 'Meta Title' },
  { value: 'meta_description', label: 'Meta Description' },
  { value: 'keyword', label: 'Từ khoá' },
  { value: 'thumbnail_prompt', label: 'Thumbnail Prompt' },
]

export default function WebhookForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const setToast = useAppStore(s => s.setToast)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [endpointUrl, setEndpointUrl] = useState('')
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH'>('POST')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  
  const [headers, setHeaders] = useState<Header[]>([])
  const [bodyType, setBodyType] = useState<'json' | 'form'>('json')
  const [bodyFields, setBodyFields] = useState<BodyField[]>([])

  useEffect(() => {
    if (isEdit) {
      loadWebhook()
    }
  }, [id])

  async function loadWebhook() {
    try {
      setLoading(true)
      const data = await invoke<any>('webhook:get', +id!)
      if (data) {
        setName(data.name || '')
        setEndpointUrl(data.endpoint_url || '')
        setMethod(data.method || 'POST')
        setStatus(data.status || 'active')
        setBodyType(data.body_type || 'json')
        
        try {
          if (data.headers) setHeaders(JSON.parse(data.headers))
        } catch (e) { /* ignore */ }
        
        try {
          if (data.body_mapping) setBodyFields(JSON.parse(data.body_mapping))
        } catch (e) { /* ignore */ }
      }
    } catch (e: any) {
      setToast({ message: 'Lỗi tải Webhook: ' + e.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !endpointUrl) {
      setToast({ message: 'Vui lòng nhập Tên và URL Endpoint', type: 'error' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        name,
        endpoint_url: endpointUrl,
        method,
        status,
        body_type: bodyType,
        headers: JSON.stringify(headers.filter(h => h.key.trim() !== '')),
        body_mapping: JSON.stringify(bodyFields.filter(f => f.key.trim() !== ''))
      }

      if (isEdit) {
        await invoke('webhook:update', { id: +id!, ...payload })
        setToast({ message: 'Cập nhật webhook thành công', type: 'success' })
      } else {
        await invoke('webhook:create', payload)
        setToast({ message: 'Tạo webhook thành công', type: 'success' })
      }
      navigate('/webhook')
    } catch (e: any) {
      setToast({ message: 'Lỗi khi lưu webhook: ' + e.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Header Builders
  const addHeader = () => setHeaders([...headers, { key: '', value: '' }])
  const updateHeader = (idx: number, field: 'key' | 'value', val: string) => {
    const newHeaders = [...headers]
    newHeaders[idx][field] = val
    setHeaders(newHeaders)
  }
  const removeHeader = (idx: number) => setHeaders(headers.filter((_, i) => i !== idx))

  // Body Builders
  const addBodyField = () => setBodyFields([...bodyFields, { key: '', type: 'manual', value: '' }])
  const updateBodyField = (idx: number, field: keyof BodyField, val: string) => {
    const newFields = [...bodyFields]
    newFields[idx][field] = val as any
    // Reset value if switching types
    if (field === 'type') {
      newFields[idx].value = val === 'field' ? 'title' : ''
    }
    setBodyFields(newFields)
  }
  const removeBodyField = (idx: number) => setBodyFields(bodyFields.filter((_, i) => i !== idx))

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--border)', background: 'var(--surface-0)', zIndex: 10 }}>
        <button className="btn-ghost" style={{ padding: 8 }} onClick={() => navigate('/webhook')}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ fontSize: 18, marginBottom: 4 }}>
            {isEdit ? 'Chỉnh sửa Webhook' : 'Tạo Webhook mới'}
          </h1>
          <p className="page-subtitle" style={{ fontSize: 13 }}>
            Cấu hình endpoint và dạng dữ liệu khi gửi bài viết sang hệ thống khác.
          </p>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
          {isEdit ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>

      <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, margin: '0 auto' }}>
          
          {/* General Info */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>1. Thông tin chung</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="label">Tên Webhook *</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="VD: Đẩy bài sang WordPress" required />
              </div>
              <div>
                <label className="label">Trạng thái</label>
                <select className="select" value={status} onChange={e => setStatus(e.target.value as any)}>
                  <option value="active">Active (Hoạt động)</option>
                  <option value="inactive">Inactive (Tạm dừng)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
              <div>
                <label className="label">Method *</label>
                <select className="select" value={method} onChange={e => setMethod(e.target.value as any)}>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="GET">GET</option>
                </select>
              </div>
              <div>
                <label className="label">Endpoint URL *</label>
                <input className="input" value={endpointUrl} onChange={e => setEndpointUrl(e.target.value)} placeholder="https://your-site.com/wp-json/wp/v2/posts" required />
              </div>
            </div>
          </div>

          {/* Headers Builder */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>2. Headers (Tuỳ chọn)</h3>
              <button className="btn-secondary" style={{ height: 28, fontSize: 12, padding: '0 12px' }} onClick={addHeader}>
                <Plus size={14} /> Thêm Header
              </button>
            </div>

            {headers.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có custom header nào.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {headers.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input className="input" style={{ flex: 1 }} placeholder="Header Key (VD: Authorization)" value={h.key} onChange={e => updateHeader(i, 'key', e.target.value)} />
                    <input className="input" style={{ flex: 2 }} placeholder="Value (VD: Bearer token...)" value={h.value} onChange={e => updateHeader(i, 'value', e.target.value)} />
                    <button className="btn-ghost" style={{ padding: 8, color: 'var(--danger)' }} onClick={() => removeHeader(i)} title="Xoá">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Body Payload Builder */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>3. Body Payload</h3>
                <select className="select" style={{ height: 30, width: 140, fontSize: 13 }} value={bodyType} onChange={e => setBodyType(e.target.value as any)}>
                  <option value="json">JSON Object</option>
                  <option value="form">Form Data</option>
                </select>
              </div>
              <button className="btn-secondary" style={{ height: 28, fontSize: 12, padding: '0 12px' }} onClick={addBodyField}>
                <Plus size={14} /> Thêm tham số
              </button>
            </div>

            {bodyFields.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Body trống. Payload đẩy đi sẽ không có field nào.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Header row for the builder */}
                <div style={{ display: 'flex', gap: 10, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', paddingBottom: 4 }}>
                  <div style={{ width: '30%' }}>Payload Key</div>
                  <div style={{ width: '130px' }}>Loại Giá trị</div>
                  <div style={{ flex: 1 }}>Giá trị tĩnh hoặc mapping dòng dữ liệu</div>
                  <div style={{ width: 34 }}></div>
                </div>

                {bodyFields.map((field, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {/* Key Input */}
                    <input className="input" style={{ width: '30%' }} placeholder="VD: content" value={field.key} onChange={e => updateBodyField(i, 'key', e.target.value)} />
                    
                    {/* Type Select */}
                    <select className="select" style={{ width: 130 }} value={field.type} onChange={e => updateBodyField(i, 'type', e.target.value)}>
                      <option value="manual">Nhập tay tĩnh</option>
                      <option value="field">Từ bài viết</option>
                    </select>

                    {/* Value Input (Dynamic based on Type) */}
                    {field.type === 'manual' ? (
                      <input className="input" style={{ flex: 1 }} placeholder="Giá trị..." value={field.value} onChange={e => updateBodyField(i, 'value', e.target.value)} />
                    ) : (
                      <select className="select" style={{ flex: 1 }} value={field.value} onChange={e => updateBodyField(i, 'value', e.target.value)}>
                        {FIELD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    )}

                    <button className="btn-ghost" style={{ padding: 8, color: 'var(--danger)' }} onClick={() => removeBodyField(i)} title="Xoá">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
