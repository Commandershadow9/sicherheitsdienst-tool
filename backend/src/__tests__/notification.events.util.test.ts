import { PassThrough } from 'stream';
import {
  registerNotificationStream,
  unregisterNotificationStream,
  publishNotificationEvent,
  getNotificationStreamStats,
  resetNotificationEvents,
} from '../utils/notificationEvents';

describe('notificationEvents util', () => {
  afterEach(() => {
    resetNotificationEvents();
  });

  it('registers subscribers and emits events respecting filters', () => {
    const stream = new PassThrough();
    const received: string[] = [];
    stream.on('data', (chunk) => received.push(chunk.toString()));

    const client = registerNotificationStream(stream as any, {
      userId: 'user-1',
      roles: ['ADMIN'],
      channels: ['email'],
    });

    publishNotificationEvent({ channel: 'push', status: 'sent', title: 'ignored' });
    publishNotificationEvent({ channel: 'email', status: 'sent', recipient: 'demo@example.com' });

    expect(received.some((msg) => msg.includes('notification.sent'))).toBe(true);
    const stats = getNotificationStreamStats();
    expect(stats.subscribers).toBe(1);
    expect(stats.channelSubscriptions.email).toBe(1);

    unregisterNotificationStream(client.id);
    const afterStats = getNotificationStreamStats();
    expect(afterStats.subscribers).toBe(0);
  });
});
