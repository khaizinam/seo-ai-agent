import React from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

const SIZE_CLASS: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const baseClass = `btn-${variant}`
  const sizeClass = SIZE_CLASS[size]
  const widthClass = fullWidth ? 'w-full justify-center' : ''
  const combinedClass = `${baseClass} ${sizeClass} ${widthClass} ${className}`.trim()

  return (
    <button
      className={combinedClass}
      disabled={disabled || loading}
      style={style}
      {...rest}
    >
      {loading ? <Loader2 size={size === 'sm' ? 12 : 16} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}
