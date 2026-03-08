import React from 'react'

export interface SectionProps {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}

export function Section({ title, action, children, className = '', noPadding = false }: SectionProps) {
  return (
    <div className={`glass-card ${className}`.trim()} style={{ padding: 0, overflow: 'hidden' }}>
      {title && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            margin: 0,
          }}>
            {title}
          </h3>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={noPadding ? {} : { padding: 20 }}>
        {children}
      </div>
    </div>
  )
}
