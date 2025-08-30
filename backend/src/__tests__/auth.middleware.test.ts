import { authenticate, authorize } from '../middleware/auth';

describe('Auth middleware', () => {
  it('authenticate calls next with 401 error when no token provided', async () => {
    const req: any = { headers: {} };
    const res: any = {};
    const next = jest.fn();
    await authenticate(req as any, res as any, next as any);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeTruthy();
    expect(err.status || err.statusCode).toBe(401);
  });

  it('authorize denies when role not permitted', () => {
    const req: any = { user: { role: 'EMPLOYEE' } };
    const res: any = {};
    const next = jest.fn();
    const mw = authorize('ADMIN');
    mw(req as any, res as any, next as any);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeTruthy();
    expect(err.status || err.statusCode).toBe(403);
  });
});
