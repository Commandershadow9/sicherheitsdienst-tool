import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const DEFAULT_ROOT = path.resolve(process.cwd(), 'storage/documents');

export function getDocumentStorageRoot(): string {
  return process.env.DOCUMENT_STORAGE_ROOT
    ? path.resolve(process.env.DOCUMENT_STORAGE_ROOT)
    : DEFAULT_ROOT;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function inferExtension(originalName: string, mimeType?: string | null) {
  const known: Record<string, string> = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/bmp': '.bmp',
  };
  if (mimeType && known[mimeType]) {
    return known[mimeType];
  }
  const ext = path.extname(originalName || '').toLowerCase();
  if (ext) return ext;
  return mimeType && mimeType.includes('/') ? `.${mimeType.split('/')[1]}` : '.bin';
}

export type SaveDocumentParams = {
  userId: string;
  originalName: string;
  buffer: Buffer;
  mimeType?: string | null;
  subFolder?: string; // Optional subfolder (e.g., 'absences')
};

export type SaveDocumentResult = {
  storedAt: string;
  absolutePath: string;
  size: number;
  mimeType?: string | null;
};

export async function saveDocumentFile({ userId, originalName, buffer, mimeType, subFolder }: SaveDocumentParams): Promise<SaveDocumentResult> {
  const root = getDocumentStorageRoot();
  const userDir = subFolder ? path.join(root, subFolder, userId) : path.join(root, userId);
  await ensureDir(userDir);
  const extension = inferExtension(originalName, mimeType);
  const unique = crypto.randomUUID();
  const fileName = `${unique}${extension}`;
  const absolutePath = path.join(userDir, fileName);
  await fs.writeFile(absolutePath, buffer, { flag: 'w' });
  const relativePath = subFolder
    ? path.join(subFolder, userId, fileName).replace(/\\/g, '/')
    : path.join(userId, fileName).replace(/\\/g, '/');
  return {
    storedAt: relativePath,
    absolutePath,
    size: buffer.length,
    mimeType,
  };
}

export async function removeDocumentFile(storedAt: string) {
  if (!storedAt) return;
  try {
    const absolute = resolveDocumentPath(storedAt);
    await fs.unlink(absolute);
  } catch (err: unknown) {
    if ((err as any)?.code === 'ENOENT') return;
    throw err;
  }
}

export function resolveDocumentPath(storedAt: string): string {
  const root = getDocumentStorageRoot();
  const safePath = storedAt.replace(/^\/+/, '').replace(/\.\.+/g, '.');
  const absolute = path.resolve(root, safePath);
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) {
    throw new Error('Ungültiger Dokumentpfad');
  }
  return absolute;
}

export async function ensureDocumentStorageRoot() {
  const root = getDocumentStorageRoot();
  await ensureDir(root);
}
