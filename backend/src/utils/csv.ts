import type { Response } from 'express';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

export function csvEscape(v: unknown): string {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export async function streamCsv(
  res: Response,
  filename: string,
  header: string[],
  rows: Iterable<Record<string, unknown>> | AsyncIterable<Record<string, unknown>>,
): Promise<void> {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  if ('flushHeaders' in res && typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  async function* gen() {
    yield header.join(',') + '\n';
    for await (const r of rows) {
      const line = header.map((h) => csvEscape(r[h])).join(',');
      yield line + '\n';
    }
  }

  await pipeline(Readable.from(gen()), res);
}
