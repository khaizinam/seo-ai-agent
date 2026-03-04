import React from 'react'
import { CampaignFormData } from './CampaignDetailsTab'

const STATUS_OPTS = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Done', value: 'done' },
]

interface Props {
  form: CampaignFormData
  setForm: React.Dispatch<React.SetStateAction<CampaignFormData>>
  errors: Partial<CampaignFormData>
}

export default function CampaignDetails({ form, setForm, errors }: Props) {
  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>THÔNG TIN CHIẾN DỊCH</h3>
      </div>
      
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Tên chiến dịch *
          </label>
          <input
            className="input"
            style={{ height: 42, background: 'var(--surface-0)', ...(errors.name ? { borderColor: 'var(--danger)' } : {}) }}
            placeholder="Nhập tên chiến dịch..."
            value={form.name}
            onChange={e => { setForm(p => ({ ...p, name: e.target.value })); }}
          />
          {errors.name && <div style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.name}</div>}
        </div>

        {/* Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Mô tả</label>
          <textarea
            className="textarea"
            style={{ minHeight: 120, background: 'var(--surface-0)' }}
            placeholder="Mô tả mục tiêu, ghi chú về chiến dịch này..."
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          />
        </div>

        {/* Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Trạng thái</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {STATUS_OPTS.map(opt => (
              <label
                key={opt.value}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  padding: '10px 16px', borderRadius: 8, fontSize: 13, minWidth: 100,
                  border: `1px solid ${form.status === opt.value ? 'var(--brand-primary)' : 'var(--border)'}`,
                  background: form.status === opt.value ? 'rgba(99,102,241,0.08)' : 'var(--surface-0)',
                  color: form.status === opt.value ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="radio"
                  name="status"
                  value={opt.value}
                  checked={form.status === opt.value}
                  onChange={() => setForm(p => ({ ...p, status: opt.value }))}
                  style={{ display: 'none' }}
                />
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: form.status === opt.value ? 'var(--brand-primary)' : 'var(--text-muted)',
                }} />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
