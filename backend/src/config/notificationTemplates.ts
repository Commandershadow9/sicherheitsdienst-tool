import { NotificationChannel } from '../utils/notificationEvents';

export type NotificationTemplateMeta = {
  key: string;
  channel: NotificationChannel;
  name: string;
  description: string;
  category: 'shift' | 'incident' | 'system';
  featureFlag?: string;
  variables: string[];
  tags?: string[];
};

type NotificationTemplateView = NotificationTemplateMeta & {
  enabled: boolean;
};

const templates: NotificationTemplateMeta[] = [
  {
    key: 'shift-changed',
    channel: 'email',
    name: 'Schicht geändert',
    description: 'Informiert Mitarbeitende über Änderungen an einer Schicht.',
    category: 'shift',
    featureFlag: 'EMAIL_NOTIFY_SHIFTS',
    variables: ['shiftTitle', 'change'],
    tags: ['shift', 'employee'],
  },
  {
    key: 'incident-created',
    channel: 'email',
    name: 'Incident erstellt (E-Mail)',
    description: 'Benachrichtigt Leitstelle/Dispo über einen neu gemeldeten Vorfall.',
    category: 'incident',
    featureFlag: 'EMAIL_NOTIFY_INCIDENTS',
    variables: ['title', 'severity', 'location', 'reportedBy', 'occurredAt', 'description'],
    tags: ['incident', 'alert'],
  },
  {
    key: 'incident-updated',
    channel: 'email',
    name: 'Incident aktualisiert (E-Mail)',
    description: 'Informiert über Status- oder Inhaltsänderungen eines Vorfalls.',
    category: 'incident',
    featureFlag: 'EMAIL_NOTIFY_INCIDENTS',
    variables: ['title', 'status', 'updatedBy', 'updatedAt', 'summary'],
    tags: ['incident', 'alert'],
  },
  {
    key: 'incident-created',
    channel: 'push',
    name: 'Incident erstellt (Push)',
    description: 'Kurzinfo für Einsatzkräfte über einen neuen Vorfall.',
    category: 'incident',
    featureFlag: 'PUSH_NOTIFY_INCIDENTS',
    variables: ['title', 'severity', 'location', 'reportedBy'],
    tags: ['incident', 'mobile'],
  },
  {
    key: 'incident-updated',
    channel: 'push',
    name: 'Incident aktualisiert (Push)',
    description: 'Kurzinfo für Einsatzkräfte über eine Statusänderung.',
    category: 'incident',
    featureFlag: 'PUSH_NOTIFY_INCIDENTS',
    variables: ['title', 'status', 'updatedBy'],
    tags: ['incident', 'mobile'],
  },
];

function isFeatureEnabled(flag?: string): boolean {
  if (!flag) return true;
  const value = String(process.env[flag] ?? '');
  if (!value) return false;
  return !['false', '0', 'off', 'no'].includes(value.toLowerCase());
}

export function listNotificationTemplates(channel?: NotificationChannel): NotificationTemplateView[] {
  return templates
    .filter((tpl) => !channel || tpl.channel === channel)
    .map((tpl) => ({
      ...tpl,
      enabled: isFeatureEnabled(tpl.featureFlag),
    }));
}

export function getNotificationTemplate(
  channel: NotificationChannel,
  key: string,
): NotificationTemplateView | undefined {
  const tpl = templates.find((t) => t.channel === channel && t.key === key);
  if (!tpl) return undefined;
  return { ...tpl, enabled: isFeatureEnabled(tpl.featureFlag) };
}
