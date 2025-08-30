import { healthCheck } from '../controllers/systemController';

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

describe('System healthCheck controller', () => {
  it('returns a JSON response without binding a port', async () => {
    const req: any = {};
    const res = createMockRes();
    const next = jest.fn();
    await healthCheck(req, res as any, next as any);
    expect(res.payload).toBeDefined();
    expect(typeof res.payload).toBe('object');
    expect([200, 503]).toContain(res.statusCode);
  });
});
