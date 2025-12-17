import fs from 'fs/promises';

export type DetectedType = { ext: 'pdf' | 'png' | 'jpg'; mime: 'application/pdf' | 'image/png' | 'image/jpeg' };

const signatures: Array<{ type: DetectedType; magic: number[] }> = [
  { type: { ext: 'pdf', mime: 'application/pdf' }, magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { type: { ext: 'png', mime: 'image/png' }, magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: { ext: 'jpg', mime: 'image/jpeg' }, magic: [0xff, 0xd8, 0xff] }, // JPEG SOI
];

export async function detectMagicBytes(filePath: string): Promise<DetectedType | null> {
  const handle = await fs.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(16);
    const { bytesRead } = await handle.read({ buffer: buf, position: 0, length: buf.length });
    const slice = buf.subarray(0, bytesRead);
    for (const sig of signatures) {
      const candidate = Buffer.from(sig.magic);
      if (slice.length >= candidate.length && slice.subarray(0, candidate.length).equals(candidate)) {
        return sig.type;
      }
    }
    return null;
  } finally {
    await handle.close();
  }
}
