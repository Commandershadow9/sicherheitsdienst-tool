import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { detectMagicBytes } from '../utils/magicBytes';
import { validateMagicBytes } from '../middleware/validateMagicBytes';

const mkTempFile = async (bytes: number[]): Promise<string> => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'magic-bytes-'));
  const filePath = path.join(tmpDir, 'file.bin');
  await fs.writeFile(filePath, Buffer.from(bytes));
  return filePath;
};

describe('magic bytes detection', () => {
  it('accepts a valid PDF header', async () => {
    const filePath = await mkTempFile([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-\n
    const detected = await detectMagicBytes(filePath);
    expect(detected?.ext).toBe('pdf');
    expect(detected?.mime).toBe('application/pdf');
  });

  it('rejects an executable masquerading as pdf', async () => {
    const filePath = await mkTempFile([0x4d, 0x5a, 0x90, 0x00]); // MZ
    const detected = await detectMagicBytes(filePath);
    expect(detected).toBeNull();
  });
});

describe('validateMagicBytes middleware', () => {
  const runMiddleware = async (filePath: string) =>
    await new Promise<{ status?: number; body?: any }>((resolve, reject) => {
      const req: any = { file: { path: filePath, mimetype: 'application/pdf' } };
      const res: any = {
        status(code: number) {
          this.statusCode = code;
          return this;
        },
        json(payload: any) {
          resolve({ status: this.statusCode, body: payload });
        },
      };
      validateMagicBytes(['pdf', 'png', 'jpg'])(req as any, res as any, (err?: any) => {
        if (err) reject(err);
        resolve({ status: 200 });
      });
    });

  it('allows valid PDF upload', async () => {
    const filePath = await mkTempFile([0x25, 0x50, 0x44, 0x46, 0x2d]);
    const result = await runMiddleware(filePath);
    expect(result.status).toBe(200);
  });

  it('blocks spoofed exe masquerading as pdf', async () => {
    const filePath = await mkTempFile([0x4d, 0x5a, 0x90, 0x00]); // MZ
    const result = await runMiddleware(filePath);
    expect(result.status).toBe(415);
    expect(result.body?.message).toMatch(/Ungültiger Dateityp/i);
  });
});
