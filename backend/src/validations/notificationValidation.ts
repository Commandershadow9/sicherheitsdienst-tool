import { z } from 'zod';

const channelEnum = z.enum(['email', 'push']);

export const notificationTestSchema = z.object({
  body: z
    .object({
      recipient: z.string().email().optional(),
      title: z.string().min(1).optional(),
      body: z.string().min(1).optional(),
      channel: channelEnum.optional(),
      templateKey: z.string().min(1).optional(),
      variables: z.record(z.any()).optional(),
      userIds: z.array(z.string().min(1)).optional(),
    })
    .superRefine((data, ctx) => {
      const channel = data.channel ?? 'email';
      if (channel === 'email') {
        if (!data.recipient) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'recipient ist erforderlich für channel=email', path: ['recipient'] });
        }
        if (!data.templateKey && (!data.title || !data.body)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'title und body werden benötigt, wenn kein templateKey angegeben ist.',
            path: ['title'],
          });
        }
      } else if (channel === 'push') {
        if (!data.userIds || data.userIds.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'userIds benötigt mindestens einen Eintrag für Push-Benachrichtigungen.',
            path: ['userIds'],
          });
        }
        if (!data.templateKey && (!data.title || !data.body)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'title und body werden benötigt, wenn kein templateKey angegeben ist.',
            path: ['title'],
          });
        }
      } else {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Unbekannter Kanal', path: ['channel'] });
      }
    }),
});

export const notificationPreferenceSchema = z.object({
  body: z
    .object({
      emailOptIn: z.boolean().optional(),
      pushOptIn: z.boolean().optional(),
    })
    .superRefine((data, ctx) => {
      if (typeof data.emailOptIn !== 'boolean' && typeof data.pushOptIn !== 'boolean') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Mindestens ein Feld (emailOptIn, pushOptIn) muss gesetzt sein.',
          path: [],
        });
      }
    }),
});

