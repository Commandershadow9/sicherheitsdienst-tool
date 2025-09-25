import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { auditLogPruneCounter } from '../utils/auditMetrics';

const DEFAULT_RETENTION_DAYS = 400;
const MIN_RETENTION_DAYS = 1;

export function resolveRetentionDays(raw?: string): number {
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isFinite(parsed) && parsed >= MIN_RETENTION_DAYS) {
    return parsed;
  }
  return DEFAULT_RETENTION_DAYS;
}

export function calculateCutoffDate(retentionDays: number): Date {
  const days = Math.max(MIN_RETENTION_DAYS, retentionDays);
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff;
}

type PruneOptions = {
  retentionDays?: number;
  dryRun?: boolean;
};

export async function pruneAuditLogs(options: PruneOptions = {}): Promise<{
  retentionDays: number;
  cutoff: Date;
  deleted: number;
  candidates: number;
}> {
  const retentionDays = options.retentionDays ?? resolveRetentionDays(process.env.AUDIT_RETENTION_DAYS);
  const cutoff = calculateCutoffDate(retentionDays);
  const dryRun = Boolean(options.dryRun);

  logger.info('[audit] pruning audit logs older than %d days (cutoff=%s)%s', retentionDays, cutoff.toISOString(), dryRun ? ' [dry-run]' : '');

  const where = { occurredAt: { lt: cutoff } } as any;
  const candidates = await (prisma as any).auditLog.count({ where });

  if (dryRun) {
    logger.info('[audit] dry-run: %d entries would be deleted.', candidates);
    auditLogPruneCounter.inc({ result: 'dry_run' });
    return { retentionDays, cutoff, deleted: 0, candidates };
  }

  const result = await (prisma as any).auditLog.deleteMany({ where });
  logger.info('[audit] deleted %d audit log entries older than %s.', result.count, cutoff.toISOString());
  auditLogPruneCounter.inc({ result: 'deleted' }, result.count);
  return { retentionDays, cutoff, deleted: result.count, candidates: result.count };
}

function parseArgs(argv: string[]) {
  const flags = new Set(argv);
  const dryRun = flags.has('--dry-run') || flags.has('-n');
  const explicitIndex = argv.findIndex((arg) => arg === '--retention-days' || arg === '-d');
  let retention: number | undefined;
  if (explicitIndex !== -1 && argv[explicitIndex + 1]) {
    retention = Number.parseInt(argv[explicitIndex + 1], 10);
  }
  return { dryRun, retentionDays: retention };
}

async function main(): Promise<void> {
  try {
    const args = parseArgs(process.argv.slice(2));
    const outcome = await pruneAuditLogs({ retentionDays: args.retentionDays, dryRun: args.dryRun });
    logger.info('[audit] prune complete: deleted=%d candidates=%d retentionDays=%d', outcome.deleted, outcome.candidates, outcome.retentionDays);
  } catch (error) {
    auditLogPruneCounter.inc({ result: 'error' });
    logger.error('[audit] prune failed: %o', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

if (require.main === module) {
  void main();
}
