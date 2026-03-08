import React from 'react'

export interface InputTextProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputClassName?: string
}

export function InputText({ className = '', inputClassName = '', ...rest }: InputTextProps) {
  return (
    <input
      className={`input ${inputClassName} ${className}`.trim()}
      {...rest}
    />
  )
}
