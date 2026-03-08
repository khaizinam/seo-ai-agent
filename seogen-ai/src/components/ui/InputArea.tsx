import React from 'react'

export interface InputAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function InputArea({ className = '', rows = 4, ...rest }: InputAreaProps) {
  return (
    <textarea
      className={`textarea ${className}`.trim()}
      rows={rows}
      {...rest}
    />
  )
}
