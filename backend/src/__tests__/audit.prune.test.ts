jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    auditLog: {
      count: jest.fn().mockResolvedValue(5),
      deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
    },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const prismaMock = require('../utils/prisma').default;

describe('pruneAuditLogs script', () => {
  beforeEach(() => {
    prismaMock.auditLog.count.mockReset().mockResolvedValue(5);
    prismaMock.auditLog.deleteMany.mockReset().mockResolvedValue({ count: 3 });
  });

  it('calculates cutoff respecting retention days', () => {
    const { calculateCutoffDate } = require('../scripts/pruneAuditLogs');
    const days = 30;
    const cutoff = calculateCutoffDate(days);
    const diff = (Date.now() - cutoff.getTime()) / (1000 * 60 * 60 * 24);
    expect(diff).toBeGreaterThanOrEqual(29.9);
    expect(diff).toBeLessThanOrEqual(30.1);
  });

  it('runs in dry run mode without deleting', async () => {
    const { pruneAuditLogs } = require('../scripts/pruneAuditLogs');
    const result = await pruneAuditLogs({ retentionDays: 10, dryRun: true });
    expect(result.deleted).toBe(0);
    expect(result.candidates).toBe(5);
    expect(prismaMock.auditLog.deleteMany).not.toHaveBeenCalled();
  });

  it('deletes when not in dry run', async () => {
    const { pruneAuditLogs } = require('../scripts/pruneAuditLogs');
    const result = await pruneAuditLogs({ retentionDays: 10, dryRun: false });
    expect(result.deleted).toBe(3);
    expect(prismaMock.auditLog.deleteMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ occurredAt: expect.objectContaining({ lt: expect.any(Date) }) }),
    });
  });
});

