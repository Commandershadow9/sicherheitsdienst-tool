import { validate } from '../middleware/validate';
import { z } from 'zod';

function mockRes() {
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

describe('validate middleware', () => {
  it('antwortet mit 422 bei Zod-Fehlern', async () => {
    const schema = z.object({ body: z.object({ name: z.string().min(1) }) });
    const handler = validate(schema as any);
    const req: any = { body: { name: '' }, query: {}, params: {} };
    const res = mockRes();
    const next = jest.fn();
    await handler(req as any, res as any, next as any);
    expect(res.statusCode).toBe(422);
    expect(res.payload?.code).toBe('VALIDATION_ERROR');
    expect(res.payload?.message).toMatch(/Validierungsfehler/);
  });
});
