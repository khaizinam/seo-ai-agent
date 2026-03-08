import React from 'react'
import { CampaignFormData } from './CampaignDetailsTab'
import { FormField, InputText, InputArea, Section } from '../ui'

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
    <Section title="THÔNG TIN CHIẾN DỊCH" noPadding>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FormField label="Tên chiến dịch" required error={errors.name as string}>
          <InputText
            placeholder="Nhập tên chiến dịch..."
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            style={errors.name ? { borderColor: 'var(--danger)' } : undefined}
          />
        </FormField>

        <FormField label="Mô tả">
          <InputArea
            rows={5}
            placeholder="Mô tả mục tiêu, ghi chú về chiến dịch này..."
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          />
        </FormField>

        <FormField label="Trạng thái">
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
        </FormField>
      </div>
    </Section>
  )
}
