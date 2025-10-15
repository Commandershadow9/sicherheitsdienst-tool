/**
 * ICS (iCalendar) Generator für Abwesenheiten
 * RFC 5545: https://datatracker.ietf.org/doc/html/rfc5545
 */

type ICSAbsence = {
  id: string;
  type: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  reason?: string | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

/**
 * Formatiert Datum für ICS (YYYYMMDD)
 * Beispiel: 2025-01-15 → 20250115
 */
function formatICSDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Formatiert Timestamp für ICS (YYYYMMDDTHHmmssZ)
 * Beispiel: 2025-01-15T14:30:00Z → 20250115T143000Z
 */
function formatICSTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Escaped Text für ICS (Newlines, Kommas, Backslashes)
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Mappt Absence Type zu ICS Category
 */
function getICSCategory(type: string): string {
  const categoryMap: Record<string, string> = {
    VACATION: 'Urlaub',
    SICKNESS: 'Krankheit',
    SPECIAL_LEAVE: 'Sonderurlaub',
    UNPAID: 'Unbezahlter Urlaub',
  };
  return categoryMap[type] || type;
}

/**
 * Mappt Absence Status zu ICS Status
 * REQUESTED → TENTATIVE (vorläufig)
 * APPROVED → CONFIRMED (bestätigt)
 * REJECTED/CANCELLED → CANCELLED
 */
function getICSStatus(status: string): string {
  if (status === 'APPROVED') return 'CONFIRMED';
  if (status === 'REQUESTED') return 'TENTATIVE';
  if (status === 'REJECTED' || status === 'CANCELLED') return 'CANCELLED';
  return 'TENTATIVE';
}

/**
 * Generiert ICS-Datei für Abwesenheiten
 */
export function generateICS(absences: ICSAbsence[], calendarName: string = 'Abwesenheiten'): string {
  const now = new Date();
  const timestamp = formatICSTimestamp(now);

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sicherheitsdienst-Tool//Absences//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICSText(calendarName)}`,
    `X-WR-CALDESC:Abwesenheiten exportiert am ${now.toLocaleDateString('de-DE')}`,
    'X-WR-TIMEZONE:Europe/Berlin',
  ].join('\r\n');

  absences.forEach((absence) => {
    const summary = absence.reason
      ? `${getICSCategory(absence.type)}: ${escapeICSText(absence.reason)}`
      : getICSCategory(absence.type);

    const description = [
      `Art: ${getICSCategory(absence.type)}`,
      `Status: ${absence.status}`,
      `Mitarbeiter: ${absence.user.firstName} ${absence.user.lastName}`,
      absence.reason ? `Grund: ${absence.reason}` : null,
    ]
      .filter(Boolean)
      .join('\\n');

    ics += '\r\n';
    ics += [
      'BEGIN:VEVENT',
      `UID:absence-${absence.id}@sicherheitsdienst-tool.local`,
      `DTSTAMP:${timestamp}`,
      `DTSTART;VALUE=DATE:${formatICSDate(absence.startsAt)}`,
      `DTEND;VALUE=DATE:${formatICSDate(new Date(absence.endsAt.getTime() + 24 * 60 * 60 * 1000))}`, // +1 Tag für Ganztags-Events
      `SUMMARY:${summary}`,
      `DESCRIPTION:${escapeICSText(description)}`,
      `STATUS:${getICSStatus(absence.status)}`,
      `CATEGORIES:${getICSCategory(absence.type)}`,
      `ORGANIZER;CN=${absence.user.firstName} ${absence.user.lastName}:mailto:${absence.user.email}`,
      'TRANSP:OPAQUE', // Zeigt als "beschäftigt" an
      'END:VEVENT',
    ].join('\r\n');
  });

  ics += '\r\n';
  ics += 'END:VCALENDAR';

  return ics;
}
