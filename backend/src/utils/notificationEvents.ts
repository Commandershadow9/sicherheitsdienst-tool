import { Response } from 'express';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export type NotificationChannel = 'email' | 'push';
export type NotificationStatus = 'sent' | 'failed';

export type NotificationEvent = {
  id: string;
  type: 'notification.sent' | 'notification.failed';
  channel: NotificationChannel;
  status: NotificationStatus;
  template?: string | null;
  recipient?: string | null;
  userIds?: string[];
  title?: string | null;
  body?: string | null;
  metadata?: Record<string, unknown>;
  error?: string | null;
  timestamp: string;
};

export type NotificationStreamFilters = {
  channels?: Set<NotificationChannel>;
  statuses?: Set<NotificationStatus>;
  templates?: Set<string>;
};

export type NotificationStreamClient = {
  id: string;
  res: Response;
  userId: string;
  roles: string[];
  filters: NotificationStreamFilters;
};

const emitter = new EventEmitter();
const subscribers = new Map<string, NotificationStreamClient>();
let lastEvent: NotificationEvent | null = null;

function normalizeStringSet(values?: Iterable<string>): Set<string> | undefined {
  if (!values) return undefined;
  const set = new Set<string>();
  for (const value of values) {
    const v = String(value).trim();
    if (v) set.add(v);
  }
  return set.size ? set : undefined;
}

function matchesFilters(client: NotificationStreamClient, event: NotificationEvent): boolean {
  const { filters } = client;
  if (filters.channels && filters.channels.size > 0 && !filters.channels.has(event.channel)) {
    return false;
  }
  if (filters.statuses && filters.statuses.size > 0 && !filters.statuses.has(event.status)) {
    return false;
  }
  if (filters.templates && filters.templates.size > 0) {
    if (!event.template || !filters.templates.has(event.template)) {
      return false;
    }
  }
  return true;
}

function writeEvent(res: Response, event: NotificationEvent) {
  if (res.writableEnded || res.writableFinished) return;
  try {
    res.write(`id: ${event.id}\n`);
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  } catch (err) {
    // Ignore write errors; cleanup will happen elsewhere
  }
}

function cleanupClient(id: string) {
  const client = subscribers.get(id);
  if (!client) return;
  subscribers.delete(id);
  try {
    client.res.end();
  } catch (err) {
    // ignore end failures
  }
}

export function publishNotificationEvent(
  input: Omit<NotificationEvent, 'id' | 'timestamp' | 'type'> & {
    type?: NotificationEvent['type'];
    timestamp?: string;
  },
): NotificationEvent {
  const event: NotificationEvent = {
    id: randomUUID(),
    type:
      input.type || (input.status === 'failed' ? 'notification.failed' : 'notification.sent'),
    channel: input.channel,
    status: input.status,
    template: input.template ?? null,
    recipient: input.recipient ?? null,
    userIds: input.userIds,
    title: input.title ?? null,
    body: input.body ?? null,
    metadata: input.metadata,
    error: input.error ?? null,
    timestamp: input.timestamp || new Date().toISOString(),
  };

  lastEvent = event;
  emitter.emit('event', event);

  for (const client of subscribers.values()) {
    if (!matchesFilters(client, event)) continue;
    writeEvent(client.res, event);
  }

  return event;
}

export function registerNotificationStream(
  res: Response,
  options: {
    userId: string;
    roles: string[];
    channels?: Iterable<string>;
    statuses?: Iterable<string>;
    templates?: Iterable<string>;
  },
): NotificationStreamClient {
  const id = randomUUID();
  const client: NotificationStreamClient = {
    id,
    res,
    userId: options.userId,
    roles: options.roles,
    filters: {
      channels: normalizeStringSet(options.channels) as Set<NotificationChannel> | undefined,
      statuses: normalizeStringSet(options.statuses) as Set<NotificationStatus> | undefined,
      templates: normalizeStringSet(options.templates),
    },
  };
  subscribers.set(id, client);
  return client;
}

export function unregisterNotificationStream(id: string) {
  cleanupClient(id);
}

export function getNotificationStreamStats() {
  const channelCounts: Record<string, number> = {};
  subscribers.forEach((client) => {
    if (!client.filters.channels || client.filters.channels.size === 0) {
      channelCounts['*'] = (channelCounts['*'] || 0) + 1;
      return;
    }
    client.filters.channels.forEach((ch) => {
      channelCounts[ch] = (channelCounts[ch] || 0) + 1;
    });
  });
  return {
    subscribers: subscribers.size,
    lastEventAt: lastEvent?.timestamp ?? null,
    lastEventType: lastEvent?.type ?? null,
    lastEventChannel: lastEvent?.channel ?? null,
    channelSubscriptions: channelCounts,
  };
}

export function onNotificationEvent(listener: (event: NotificationEvent) => void) {
  emitter.on('event', listener);
  return () => emitter.off('event', listener);
}

export function resetNotificationEvents() {
  subscribers.forEach((client) => {
    try {
      client.res.end();
    } catch (err) {
      // ignore
    }
  });
  subscribers.clear();
  lastEvent = null;
}
