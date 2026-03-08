import React from 'react'
import { Loader2, Sparkles } from 'lucide-react'

export interface ButtonGenAIProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  size?: 'sm' | 'md'
}

export function ButtonGenAI({
  loading = false,
  size = 'md',
  children,
  className = '',
  disabled,
  ...rest
}: ButtonGenAIProps) {
  const height = size === 'sm' ? 32 : 40
  const fontSize = size === 'sm' ? 12 : 13
  const iconSize = size === 'sm' ? 13 : 15

  return (
    <button
      className={`btn-secondary ${className}`.trim()}
      disabled={disabled || loading}
      style={{
        height,
        fontSize,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)',
        color: 'white',
        border: 'none',
        paddingLeft: size === 'sm' ? 12 : 16,
        paddingRight: size === 'sm' ? 12 : 16,
      }}
      {...rest}
    >
      {loading
        ? <Loader2 size={iconSize} className="animate-spin" />
        : <Sparkles size={iconSize} />
      }
      {children}
    </button>
  )
}
