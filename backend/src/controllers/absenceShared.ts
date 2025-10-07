import createError from 'http-errors';
import type { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';

export const PAGE_MAX = 100;

export const selectAbsence = {
  id: true,
  type: true,
  status: true,
  startsAt: true,
  endsAt: true,
  reason: true,
  decisionNote: true,
  decidedById: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  decidedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  documents: {
    select: {
      id: true,
      filename: true,
      mimeType: true,
      size: true,
      createdAt: true,
      uploadedBy: true,
    },
  },
} satisfies Prisma.AbsenceSelect;

export function ensureDate(value: string, label: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createError(422, `${label} ist ungültig.`);
  }
  return date;
}

export function canManage(actorRole: string | undefined): boolean {
  return actorRole === 'ADMIN' || actorRole === 'MANAGER';
}

export function ensureAccess(absence: { userId: string }, actor: { id: string; role: string }) {
  if (actor.role === 'ADMIN' || actor.role === 'MANAGER') return;
  if (absence.userId === actor.id) return;
  throw createError(403, 'Keine Berechtigung für diese Abwesenheit.');
}

export async function fetchAbsenceOr404(id: string) {
  const absence = await prisma.absence.findUnique({
    where: { id },
    select: { ...selectAbsence, userId: true },
  });
  if (!absence) {
    throw createError(404, 'Abwesenheit nicht gefunden.');
  }
  return absence;
}
