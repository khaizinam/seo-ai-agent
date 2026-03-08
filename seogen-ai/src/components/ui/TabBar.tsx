import React from 'react'

export interface TabItem {
  key: string
  label: string
}

export interface TabBarProps {
  tabs: TabItem[]
  active: string
  onChange: (key: string) => void
  className?: string
}

export function TabBar({ tabs, active, onChange, className = '' }: TabBarProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: '1px solid var(--border)',
      }}
    >
      {tabs.map(tab => (
        <button
          key={tab.key}
          className="btn-ghost"
          style={{
            background: active === tab.key ? 'rgba(99,102,241,0.1)' : 'transparent',
            color: active === tab.key ? 'var(--brand-primary)' : 'var(--text-secondary)',
            fontWeight: active === tab.key ? 600 : 500,
          }}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
