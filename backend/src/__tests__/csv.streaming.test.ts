import { streamCsv } from '../utils/csv';
import { Writable } from 'stream';

function createMockRes() {
  const chunks: Buffer[] = [];
  const sink = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      cb();
    },
  }) as any;
  // Minimal Express.Response surface used by streamCsv
  sink.setHeader = (_k: string, _v: string) => {};
  sink.flushHeaders = () => {};
  return { res: sink as any, getSize: () => chunks.reduce((n, b) => n + b.length, 0) };
}

describe('streamCsv memory characteristics', () => {
  it('streams 100k rows without excessive heap usage', async () => {
    const { res, getSize } = createMockRes();
    const header = ['c1', 'c2', 'c3'];
    async function* rows() {
      for (let i = 0; i < 100_000; i++) {
        yield { c1: i, c2: `v${i}`, c3: i % 2 ? 'odd' : 'even' } as Record<string, unknown>;
      }
    }
    const before = process.memoryUsage().heapUsed;
    await streamCsv(res, 'big.csv', header, rows());
    const after = process.memoryUsage().heapUsed;
    // Expect delta to be below ~50MB (allow headroom in CI); adjust if needed
    const deltaMB = (after - before) / (1024 * 1024);
    expect(deltaMB).toBeLessThan(50);
    // Basic sanity: some bytes were written (header + rows)
    expect(getSize()).toBeGreaterThan(100_000); // at least > number of rows
  }, 30000);
});

