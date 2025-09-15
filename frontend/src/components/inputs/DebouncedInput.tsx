import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value?: string
  onChange?: (value: string) => void
  delay?: number
}

export function DebouncedInput({ value = '', onChange, delay = 300, ...rest }: Props) {
  const [inner, setInner] = useState(value)
  useEffect(() => setInner(value), [value])
  const timeout = useMemo(() => ({ id: 0 as any }), [])
  useEffect(() => () => clearTimeout(timeout.id), [timeout])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setInner(v)
    if (!onChange) return
    clearTimeout(timeout.id)
    timeout.id = setTimeout(() => onChange(v), delay) as any
  }

  return <Input {...rest} value={inner} onChange={handleChange} />
}
