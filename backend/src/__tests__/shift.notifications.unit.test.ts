import { createShift, updateShift, deleteShift } from '../controllers/shiftController';

jest.mock('@prisma/client', () => {
  (global as any).prismaMock = (global as any).prismaMock || {
    shift: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    shiftAssignment: {
      deleteMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => (global as any).prismaMock) };
});

const sendShiftChangedEmail = jest.fn();
jest.mock('../services/emailService', () => ({
  sendShiftChangedEmail: (...args: any[]) => (sendShiftChangedEmail as any)(...args),
}));

describe('Shift notifications (unit, feature-flag)', () => {
  const orig = process.env.EMAIL_NOTIFY_SHIFTS;
  const res = () => {
    const r: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    return r;
  };
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env.EMAIL_NOTIFY_SHIFTS = orig;
  });

  it('calls email service on update when flag=on', async () => {
    process.env.EMAIL_NOTIFY_SHIFTS = 'true';
    const r = res();
    (global as any).prismaMock.shift.update.mockResolvedValueOnce({
      id: 'sh1',
      title: 'Nachtwache',
      assignments: [
        { user: { id: 'u1', email: 'a@example.com' } },
        { user: { id: 'u2', email: 'b@example.com' } },
      ],
    });
    await updateShift({ params: { id: 'sh1' }, body: { title: 'Neu' } } as any, r as any, next as any);
    expect(r.json).toHaveBeenCalled();
    expect(sendShiftChangedEmail).toHaveBeenCalled();
    const firstArgs = (sendShiftChangedEmail as any).mock.calls[0];
    expect(firstArgs[0]).toContain('@');
  });

  it('does not call email service on update when flag=off', async () => {
    process.env.EMAIL_NOTIFY_SHIFTS = 'false';
    const r = res();
    (global as any).prismaMock.shift.update.mockResolvedValueOnce({
      id: 'sh1',
      title: 'Nachtwache',
      assignments: [{ user: { id: 'u1', email: 'a@example.com' } }],
    });
    await updateShift({ params: { id: 'sh1' }, body: { title: 'Neu' } } as any, r as any, next as any);
    expect(sendShiftChangedEmail).not.toHaveBeenCalled();
  });

  it('calls email service on delete when flag=on', async () => {
    process.env.EMAIL_NOTIFY_SHIFTS = 'true';
    const r = res();
    (global as any).prismaMock.shift.findUnique.mockResolvedValueOnce({
      id: 'sh1',
      title: 'Spätschicht',
      assignments: [{ user: { id: 'u1', email: 'a@example.com' } }],
    });
    (global as any).prismaMock.shiftAssignment.deleteMany.mockResolvedValueOnce({ count: 1 });
    (global as any).prismaMock.shift.delete.mockResolvedValueOnce({ id: 'sh1', title: 'Spätschicht' });
    await deleteShift({ params: { id: 'sh1' } } as any, r as any, next as any);
    expect(r.json).toHaveBeenCalled();
    expect(sendShiftChangedEmail).toHaveBeenCalledTimes(1);
  });

  it('does not call email service on create when no assignments', async () => {
    process.env.EMAIL_NOTIFY_SHIFTS = 'true';
    const r = res();
    (global as any).prismaMock.shift.create.mockResolvedValueOnce({ id: 'sh1', title: 'Frühschicht', assignments: [] });
    await createShift({ body: { title: 'Frühschicht', location: 'HQ', startTime: new Date().toISOString(), endTime: new Date(Date.now()+3600000).toISOString() } } as any, r as any, next as any);
    expect(r.status).toHaveBeenCalledWith(201);
    expect(sendShiftChangedEmail).not.toHaveBeenCalled();
  });
});
