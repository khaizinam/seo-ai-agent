import { useState, useEffect, useCallback } from 'react'
import { invoke } from '../lib/api'
import {
  Image, Upload, Download, Loader2, X, Check,
  Maximize, FileImage, Zap, Settings2
} from 'lucide-react'

interface UploadedImage {
  base64: string
  name: string
  width: number
  height: number
  size: number
  format: string
}

interface ConvertedResult {
  base64: string
  size: number
  width: number
  height: number
  format: string
}

const WIDTH_PRESETS = [1200, 800, 600, 250]

export default function ImageConverterPage() {
  const [image, setImage] = useState<UploadedImage | null>(null)
  const [result, setResult] = useState<ConvertedResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Options
  const [resizeWidth, setResizeWidth] = useState(800)
  const [customWidth, setCustomWidth] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [outputFormat, setOutputFormat] = useState<'webp' | 'jpg'>('webp')
  const [quality, setQuality] = useState(82)
  const [compress, setCompress] = useState(true)

  // Load saved config
  useEffect(() => {
    invoke<any>('settings:getAll').then(settings => {
      const cfg = settings?.imageConverterConfig
      if (cfg) {
        setResizeWidth(cfg.resizeWidth || 800)
        setCustomWidth(cfg.customWidth || '')
        setUseCustom(cfg.useCustom || false)
        setOutputFormat(cfg.outputFormat || 'webp')
        setQuality(cfg.quality ?? 82)
        setCompress(cfg.compress ?? true)
      }
    })
  }, [])

  // Save config when options change
  useEffect(() => {
    const timer = setTimeout(() => {
      invoke('settings:set', {
        key: 'imageConverterConfig',
        value: { resizeWidth, customWidth, useCustom, outputFormat, quality, compress }
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [resizeWidth, customWidth, useCustom, outputFormat, quality, compress])

  const activeWidth = useCustom ? (parseInt(customWidth) || 800) : resizeWidth

  const handlePickFile = useCallback(async () => {
    const paths = await invoke<string[] | null>('image:pickFiles')
    if (!paths || paths.length === 0) return

    const filePath = paths[0]
    const fileData = await invoke<{ success: boolean; base64: string; name: string }>('image:readFileBase64', filePath)
    if (!fileData.success) return

    const meta = await invoke<{ success: boolean; width: number; height: number; format: string; size: number }>(
      'image:metadataFromBuffer', fileData.base64
    )
    if (!meta.success) return

    setImage({
      base64: fileData.base64,
      name: fileData.name,
      width: meta.width,
      height: meta.height,
      size: meta.size,
      format: meta.format || 'unknown',
    })
    setResult(null)
  }, [])

  // Drag & drop support
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const raw = reader.result as string
      const base64 = raw.split(',')[1]
      
      const meta = await invoke<{ success: boolean; width: number; height: number; format: string; size: number }>(
        'image:metadataFromBuffer', base64
      )
      if (!meta.success) return

      setImage({
        base64,
        name: file.name,
        width: meta.width,
        height: meta.height,
        size: file.size,
        format: meta.format || 'unknown',
      })
      setResult(null)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleConvert = async () => {
    if (!image) return
    setProcessing(true)
    setResult(null)

    const res = await invoke<ConvertedResult & { success: boolean; error?: string }>('image:convert', {
      base64: image.base64,
      width: activeWidth,
      format: outputFormat,
      quality,
      compress,
    })

    if (res.success) {
      setResult({ base64: res.base64, size: res.size, width: res.width, height: res.height, format: res.format })
    } else {
      alert('Lỗi: ' + res.error)
    }
    setProcessing(false)
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    const ext = result.format === 'webp' ? 'webp' : 'jpg'
    const baseName = image?.name?.replace(/\.[^.]+$/, '') || 'converted'
    const defaultName = `${baseName}_${result.width}w.${ext}`

    await invoke('image:saveConverted', { base64: result.base64, defaultName })
    setSaving(false)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const savedPercent = image && result
    ? Math.round((1 - result.size / image.size) * 100)
    : 0

  return (
    <div style={{ padding: 28, height: '100%', overflow: 'auto' }}>
      <div className="page-header">
        <h1 className="page-title"><FileImage size={26} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />Chuyển đổi ảnh</h1>
        <p className="page-subtitle">Resize, nén & chuyển đổi định dạng PNG/JPG → WebP/JPG</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Left: Upload + Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Upload zone */}
          {!image ? (
            <div
              onClick={handlePickFile}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              className="glass-card"
              style={{
                padding: 60, textAlign: 'center', cursor: 'pointer',
                border: '2px dashed var(--border)', borderRadius: 14,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand-primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <Upload size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Kéo thả ảnh vào đây</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>hoặc nhấn để chọn file • PNG, JPG, JPEG</div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: 16 }}>
              {/* Image info header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Image size={16} color="var(--brand-primary)" />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{image.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-ghost" onClick={handlePickFile} style={{ fontSize: 12 }}>Đổi ảnh</button>
                  <button className="btn-ghost" onClick={() => { setImage(null); setResult(null) }} style={{ color: 'var(--danger)', fontSize: 12 }}>
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Original info badges */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <span className="badge badge-info">{image.width} × {image.height}</span>
                <span className="badge badge-purple">{image.format.toUpperCase()}</span>
                <span className="badge badge-muted">{formatSize(image.size)}</span>
              </div>

              {/* Preview */}
              <div style={{ borderRadius: 10, overflow: 'hidden', background: 'var(--surface-2)', display: 'flex', justifyContent: 'center' }}>
                <img
                  src={`data:image/${image.format};base64,${image.base64}`}
                  alt="preview"
                  style={{ maxWidth: '100%', maxHeight: 340, objectFit: 'contain' }}
                />
              </div>
            </div>
          )}

          {/* Result Preview */}
          {result && (
            <div className="glass-card animate-fade-in" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#10b981" />
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#10b981' }}>Kết quả</span>
                </div>
                <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ fontSize: 12 }}>
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <><Download size={13} /> Lưu ảnh</>}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <span className="badge badge-success">{result.width} × {result.height}</span>
                <span className="badge badge-purple">{result.format.toUpperCase()}</span>
                <span className="badge badge-muted">{formatSize(result.size)}</span>
                {savedPercent > 0 && (
                  <span className="badge badge-success">-{savedPercent}% kích thước</span>
                )}
              </div>

              <div style={{ borderRadius: 10, overflow: 'hidden', background: 'var(--surface-2)', display: 'flex', justifyContent: 'center' }}>
                <img
                  src={`data:image/${result.format};base64,${result.base64}`}
                  alt="result"
                  style={{ maxWidth: '100%', maxHeight: 340, objectFit: 'contain' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Options Panel */}
        <div className="glass-card" style={{ padding: 20, position: 'sticky', top: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings2 size={15} color="var(--brand-primary)" /> Cài đặt chuyển đổi
          </h3>

          {/* Resize Width */}
          <div style={{ marginBottom: 20 }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Maximize size={12} /> Chiều rộng (px)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 8 }}>
              {WIDTH_PRESETS.map(w => (
                <button
                  key={w}
                  onClick={() => { setResizeWidth(w); setUseCustom(false) }}
                  style={{
                    padding: '8px 4px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500,
                    border: `1px solid ${!useCustom && resizeWidth === w ? 'var(--brand-primary)' : 'var(--border)'}`,
                    background: !useCustom && resizeWidth === w ? 'rgba(99,102,241,0.12)' : 'var(--surface-2)',
                    color: !useCustom && resizeWidth === w ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >{w}px</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => setUseCustom(true)}
                style={{
                  padding: '8px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  border: `1px solid ${useCustom ? 'var(--brand-primary)' : 'var(--border)'}`,
                  background: useCustom ? 'rgba(99,102,241,0.12)' : 'var(--surface-2)',
                  color: useCustom ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
              >Khác</button>
              {useCustom && (
                <input
                  className="input"
                  type="number"
                  placeholder="VD: 960"
                  value={customWidth}
                  onChange={e => setCustomWidth(e.target.value)}
                  style={{ flex: 1, height: 36 }}
                />
              )}
            </div>
            {image && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                Ảnh gốc: {image.width}px {activeWidth > image.width && <span style={{ color: 'var(--warning)' }}>⚠ Lớn hơn gốc!</span>}
              </div>
            )}
          </div>

          {/* Output Format */}
          <div style={{ marginBottom: 20 }}>
            <label className="label">Định dạng đầu ra</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {(['webp', 'jpg'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setOutputFormat(f)}
                  style={{
                    padding: '10px 8px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600,
                    border: `1px solid ${outputFormat === f ? 'var(--brand-primary)' : 'var(--border)'}`,
                    background: outputFormat === f ? 'rgba(99,102,241,0.12)' : 'var(--surface-2)',
                    color: outputFormat === f ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >{f.toUpperCase()}</button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div style={{ marginBottom: 20 }}>
            <label className="label">Chất lượng: {quality}%</label>
            <input
              type="range"
              min={10}
              max={100}
              step={1}
              value={quality}
              onChange={e => setQuality(+e.target.value)}
              style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              <span>10% (nhỏ nhất)</span><span>100% (gốc)</span>
            </div>
          </div>

          {/* Compress */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={compress}
                onChange={e => setCompress(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <Zap size={13} /> Nén tối ưu (MozJPEG / WebP effort 6)
            </label>
          </div>

          {/* Convert Button */}
          <button
            className="btn-primary"
            onClick={handleConvert}
            disabled={!image || processing}
            style={{ width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: 14 }}
          >
            {processing ? (
              <><Loader2 size={16} className="animate-spin" /> Đang xử lý...</>
            ) : (
              <><Zap size={16} /> Chuyển đổi ngay</>
            )}
          </button>

          {/* Summary when done */}
          {result && image && (
            <div style={{
              marginTop: 16, padding: 12, borderRadius: 10,
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
              fontSize: 12, color: '#10b981', lineHeight: 1.8,
            }}>
              <div><strong>✅ Kích thước:</strong> {formatSize(image.size)} → {formatSize(result.size)}</div>
              <div><strong>📐 Kích cỡ:</strong> {image.width}×{image.height} → {result.width}×{result.height}</div>
              {savedPercent > 0 && <div><strong>💾 Giảm:</strong> {savedPercent}%</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
