import React from 'react'

export interface SelectOption {
  label: string
  value: string | number
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  placeholder?: string
}

export function SelectField({
  options,
  placeholder,
  className = '',
  ...rest
}: SelectFieldProps) {
  return (
    <select className={`select ${className}`.trim()} {...rest}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
