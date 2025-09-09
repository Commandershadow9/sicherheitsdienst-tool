import type { Response } from 'express';

export function csvEscape(v: unknown): string {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function streamCsv(res: Response, filename: string, header: string[], rows: Array<Record<string, unknown>> | Iterable<Record<string, unknown>>) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.write(header.join(',') + '\n');
  for (const r of rows as Iterable<Record<string, unknown>>) {
    const line = header.map((h) => csvEscape((r as any)[h])).join(',');
    res.write(line + '\n');
  }
  res.end();
}

