import * as React from 'react'

type FormFieldProps = {
  label?: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
}

export function FormField({ label, htmlFor, children, className }: FormFieldProps) {
  return (
    <div className={['space-y-1', className].filter(Boolean).join(' ')}>
      {label && (
        <label className="text-xs" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
    </div>
  )}

export default FormField

