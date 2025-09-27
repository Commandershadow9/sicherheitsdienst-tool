import type { AbsenceStatus, AbsenceType } from './types'

export const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  VACATION: 'Urlaub',
  SICKNESS: 'Krankheit',
  SPECIAL_LEAVE: 'Sonderurlaub',
  UNPAID: 'Unbezahlt',
}

export const ABSENCE_TYPES: Array<{ value: AbsenceType; label: string }> = (Object.keys(ABSENCE_TYPE_LABELS) as AbsenceType[]).map((value) => ({
  value,
  label: ABSENCE_TYPE_LABELS[value],
}))

export const ABSENCE_STATUS_LABELS: Record<AbsenceStatus, string> = {
  REQUESTED: 'Angefragt',
  APPROVED: 'Genehmigt',
  REJECTED: 'Abgelehnt',
  CANCELLED: 'Storniert',
}

export const ABSENCE_STATUSES: Array<{ value: AbsenceStatus; label: string }> = (Object.keys(
  ABSENCE_STATUS_LABELS,
) as AbsenceStatus[]).map((value) => ({
  value,
  label: ABSENCE_STATUS_LABELS[value],
}))

export function getAbsenceTypeLabel(type: AbsenceType): string {
  return ABSENCE_TYPE_LABELS[type] ?? type
}

export function getAbsenceStatusLabel(status: AbsenceStatus): string {
  return ABSENCE_STATUS_LABELS[status] ?? status
}

export function formatPeriod(startIso: string, endIso: string, locale: string = 'de-DE'): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startIso} – ${endIso}`
  }
  const sameDay = start.toDateString() === end.toDateString()
  const formatterDate = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
  const formatterTime = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (sameDay) {
    return `${formatterDate.format(start)} · ${formatterTime.format(start)} – ${formatterTime.format(end)}`
  }
  return `${formatterDate.format(start)} ${formatterTime.format(start)} – ${formatterDate.format(end)} ${formatterTime.format(end)}`
}
