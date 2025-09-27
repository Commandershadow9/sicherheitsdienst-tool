import { describe, it, expect } from 'vitest'
import { getAbsenceStatusLabel, getAbsenceTypeLabel, formatPeriod } from './utils'

describe('absences utils', () => {
  it('returns readable labels for known types and status', () => {
    expect(getAbsenceTypeLabel('VACATION')).toBe('Urlaub')
    expect(getAbsenceStatusLabel('APPROVED')).toBe('Genehmigt')
  })

  it('falls back to raw value for unknown labels', () => {
    expect(getAbsenceTypeLabel('UNKNOWN' as any)).toBe('UNKNOWN')
    expect(getAbsenceStatusLabel('FOO' as any)).toBe('FOO')
  })

  it('formats periods on same day compactly', () => {
    const start = '2025-09-01T08:00:00Z'
    const end = '2025-09-01T17:00:00Z'
    const formatted = formatPeriod(start, end, 'de-DE')
    expect(formatted).toMatch(/01\./)
    expect(formatted).toMatch(/\d{2}:\d{2}/)
    expect(formatted).toContain('–')
  })

  it('formats multi-day periods with both dates', () => {
    const start = '2025-09-01T08:00:00Z'
    const end = '2025-09-05T17:00:00Z'
    const formatted = formatPeriod(start, end, 'de-DE')
    expect(formatted).toMatch(/01\./)
    expect(formatted).toMatch(/05\./)
  })
})
