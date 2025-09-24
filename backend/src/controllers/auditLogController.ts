import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { streamCsv } from '../utils/csv';

const MAX_EXPORT_BATCH = 200;

type ParsedDateRange = {
  from?: Date;
  to?: Date;
};

type FilterResult = {
  where: Record<string, any>;
  pagination: {
    page: number;
    pageSize: number;
    skip: number;
  };
  dates: ParsedDateRange;
  error?: { status: number; body: { success: false; message: string } };
};

function parseDate(input: unknown): Date | null | undefined {
  if (input === undefined || input === null || input === '') {
    return undefined;
  }
  const candidate = new Date(String(input));
  if (Number.isNaN(candidate.getTime())) {
    return null;
  }
  return candidate;
}

function buildFilters(query: Request['query']): FilterResult {
  const pageRaw = parseInt(String(query.page ?? '1'), 10);
  const pageSizeRaw = parseInt(String(query.pageSize ?? '25'), 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? Math.min(pageSizeRaw, 100) : 25;
  const skip = (page - 1) * pageSize;

  const fromDate = parseDate(query.from);
  const toDate = parseDate(query.to);
  if (fromDate === null || toDate === null) {
    return {
      where: {},
      pagination: { page, pageSize, skip },
      dates: {},
      error: {
        status: 400,
        body: { success: false, message: 'Parameter "from" oder "to" ist kein gültiges Datum.' },
      },
    };
  }

  const where: Record<string, any> = {};
  if (typeof query.actorId === 'string' && query.actorId.trim()) {
    where.actorId = query.actorId.trim();
  }
  if (typeof query.resourceType === 'string' && query.resourceType.trim()) {
    where.resourceType = query.resourceType.trim();
  }
  if (typeof query.resourceId === 'string' && query.resourceId.trim()) {
    where.resourceId = query.resourceId.trim();
  }
  if (typeof query.action === 'string' && query.action.trim()) {
    where.action = query.action.trim();
  }
  if (typeof query.outcome === 'string' && query.outcome.trim()) {
    where.outcome = query.outcome.trim();
  }

  const dateRange: ParsedDateRange = {};
  if (fromDate || toDate) {
    where.occurredAt = {};
    if (fromDate) {
      where.occurredAt.gte = fromDate;
      dateRange.from = fromDate;
    }
    if (toDate) {
      where.occurredAt.lte = toDate;
      dateRange.to = toDate;
    }
  }

  return {
    where,
    pagination: { page, pageSize, skip },
    dates: dateRange,
  };
}

export const listAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters = buildFilters(req.query);
    if (filters.error) {
      res.status(filters.error.status).json(filters.error.body);
      return;
    }

    const [items, total] = await Promise.all([
      (prisma as any).auditLog.findMany({
        where: filters.where,
        orderBy: { occurredAt: 'desc' },
        skip: filters.pagination.skip,
        take: filters.pagination.pageSize,
      }),
      (prisma as any).auditLog.count({ where: filters.where }),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        page: filters.pagination.page,
        pageSize: filters.pagination.pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / filters.pagination.pageSize), 1),
      },
      filters: {
        actorId: filters.where.actorId,
        resourceType: filters.where.resourceType,
        resourceId: filters.where.resourceId,
        action: filters.where.action,
        outcome: filters.where.outcome,
        from: filters.dates.from?.toISOString(),
        to: filters.dates.to?.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters = buildFilters(req.query);
    if (filters.error) {
      res.status(filters.error.status).json(filters.error.body);
      return;
    }

    const wantsCsv = String(req.query.format || '').toLowerCase() === 'csv' ||
      (typeof req.headers['accept'] === 'string' && req.headers['accept'].includes('text/csv'));

    if (!wantsCsv) {
      res.status(406).json({ success: false, message: 'Nur CSV-Export wird unterstützt. Verwende ?format=csv oder Accept: text/csv.' });
      return;
    }

    const header = [
      'id',
      'occurredAt',
      'action',
      'resourceType',
      'resourceId',
      'actorId',
      'actorRole',
      'actorIp',
      'outcome',
      'requestId',
      'userAgent',
      'data',
    ];
    const filename = `audit_logs_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;

    async function* rows() {
      for (let offset = 0; ; offset += MAX_EXPORT_BATCH) {
        const batch = await (prisma as any).auditLog.findMany({
          where: filters.where,
          orderBy: { occurredAt: 'desc' },
          skip: offset,
          take: MAX_EXPORT_BATCH,
        });
        if (batch.length === 0) {
          break;
        }
        for (const entry of batch) {
          yield {
            id: entry.id,
            occurredAt: entry.occurredAt.toISOString(),
            action: entry.action,
            resourceType: entry.resourceType,
            resourceId: entry.resourceId ?? '',
            actorId: entry.actorId ?? '',
            actorRole: entry.actorRole ?? '',
            actorIp: entry.actorIp ?? '',
            outcome: entry.outcome ?? '',
            requestId: entry.requestId ?? '',
            userAgent: entry.userAgent ?? '',
            data: entry.data ? JSON.stringify(entry.data) : '',
          };
        }
        if (batch.length < MAX_EXPORT_BATCH) {
          break;
        }
      }
    }

    await streamCsv(res, filename, header, rows());
  } catch (error) {
    next(error);
  }
};
