import { getSystemStats, healthCheck } from '../controllers/systemController';

function createMockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: any) => {
    res.payload = payload;
    return res;
  };
  return res;
}

describe('System controllers', () => {
  it('healthCheck returns JSON with status 200 or 503', async () => {
    const req: any = {};
    const res = createMockRes();
    const next = jest.fn();
    await healthCheck(req, res as any, next as any);
    expect([200, 503]).toContain(res.statusCode);
    expect(typeof res.payload).toBe('object');
  });

  it('getSystemStats returns structured JSON or propagates error as 5xx', async () => {
    const req: any = {};
    const res = createMockRes();
    const next = jest.fn();
    await getSystemStats(req, res as any, next as any);
    // Either successful JSON, or forwarded to error handler; in both cases test should complete.
    if (res.payload) {
      expect(res.payload).toHaveProperty('success', true);
      expect(res.payload).toHaveProperty('data');
    } else {
      expect(next).toHaveBeenCalled();
    }
  });
});
