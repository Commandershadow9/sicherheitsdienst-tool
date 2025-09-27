export const INCIDENT_SEVERITIES = [
  { value: 'LOW', label: 'Niedrig' },
  { value: 'MEDIUM', label: 'Mittel' },
  { value: 'HIGH', label: 'Hoch' },
  { value: 'CRITICAL', label: 'Kritisch' },
] as const

export const INCIDENT_STATUSES = [
  { value: 'OPEN', label: 'Offen' },
  { value: 'IN_PROGRESS', label: 'In Bearbeitung' },
  { value: 'RESOLVED', label: 'Gelöst' },
  { value: 'CLOSED', label: 'Geschlossen' },
] as const

export type IncidentSeverity = typeof INCIDENT_SEVERITIES[number]['value']
export type IncidentStatus = typeof INCIDENT_STATUSES[number]['value']

const severityLabelMap = Object.fromEntries(
  INCIDENT_SEVERITIES.map(({ value, label }) => [value, label])
) as Record<IncidentSeverity, string>

const statusLabelMap = Object.fromEntries(
  INCIDENT_STATUSES.map(({ value, label }) => [value, label])
) as Record<IncidentStatus, string>

export function getIncidentSeverityLabel(value: string) {
  return severityLabelMap[value as IncidentSeverity] ?? value
}

export function getIncidentStatusLabel(value: string) {
  return statusLabelMap[value as IncidentStatus] ?? value
}
