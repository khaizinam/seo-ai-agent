import React from 'react'
import { ArrowLeft } from 'lucide-react'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, onBack, actions, className = '' }: PageHeaderProps) {
  return (
    <div
      className={className}
      style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}
    >
      {onBack && (
        <button
          className="btn-ghost"
          onClick={onBack}
          style={{ padding: '6px 10px', fontSize: 13, background: 'var(--surface-1)', flexShrink: 0 }}
        >
          <ArrowLeft size={15} />
        </button>
      )}
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
    </div>
  )
}
