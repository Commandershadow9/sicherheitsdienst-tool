import type { Request } from 'express';
import { logAuditEvent, type AuditLogEventInput } from '../services/auditLogService';
import logger from './logger';
import * as net from 'net';

export type RequestActor = { id?: string | null; role?: string | null } | undefined;

type BuildableAuditEvent = Omit<AuditLogEventInput, 'actorId' | 'actorRole' | 'actorIp' | 'requestId' | 'userAgent'> &
  Partial<Pick<AuditLogEventInput, 'actorId' | 'actorRole' | 'actorIp' | 'requestId' | 'userAgent'>>;

function normalizeUserAgent(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function getRequestUser(req: Request): RequestActor {
  return (req.user as RequestActor) || undefined;
}

type TrustedCidr = { family: 'ipv4' | 'ipv6'; base: bigint; mask: number };

const DEFAULT_TRUSTED_PROXIES = [
  '10.0.0.0/8', // Private A
  '172.16.0.0/12', // Private B (Docker default)
  '192.168.0.0/16', // Private C
  '127.0.0.1/32', // Loopback
  '::1/128', // IPv6 loopback
  'fc00::/7', // Unique local IPv6
];

function normalizeIp(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.trim().length === 0) return null;
  let ip = raw.trim();
  if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
  return ip;
}

function ipv4ToBigInt(ip: string): bigint | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let result = 0n;
  for (const part of parts) {
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    result = (result << 8n) + BigInt(n);
  }
  return result;
}

function expandIpv6(ip: string): string | null {
  // Handle IPv4-mapped tail (e.g. ::ffff:172.18.0.1)
  if (ip.includes('.') && ip.includes(':')) {
    const lastColon = ip.lastIndexOf(':');
    const head = ip.slice(0, lastColon);
    const ipv4Part = ip.slice(lastColon + 1);
    const octets = ipv4Part.split('.').map((o) => parseInt(o, 10));
    if (octets.length === 4 && octets.every((o) => Number.isInteger(o) && o >= 0 && o <= 255)) {
      const hi = ((octets[0] << 8) | octets[1]).toString(16);
      const lo = ((octets[2] << 8) | octets[3]).toString(16);
      ip = `${head}:${hi}:${lo}`;
    }
  }

  const parts = ip.split('::');
  if (parts.length > 2) return null;
  const head = parts[0] ? parts[0].split(':').filter(Boolean) : [];
  const tail = parts[1] ? parts[1].split(':').filter(Boolean) : [];
  const missing = 8 - (head.length + tail.length);
  if (missing < 0) return null;
  const full = [...head, ...Array(missing).fill('0'), ...tail].map((segment) => segment.padStart(4, '0'));
  return full.join(':');
}

function ipv6ToBigInt(ip: string): bigint | null {
  const expanded = expandIpv6(ip);
  if (!expanded) return null;
  const hex = expanded.replace(/:/g, '');
  if (hex.length !== 32) return null;
  return BigInt(`0x${hex}`);
}

function parseCidr(entry: string): TrustedCidr | null {
  const trimmed = entry.trim();
  if (!trimmed) return null;
  const [ip, maskRaw] = trimmed.includes('/') ? trimmed.split('/') : [trimmed, undefined];
  const normalizedIp = normalizeIp(ip);
  if (!normalizedIp) return null;
  const family = net.isIP(normalizedIp) === 6 ? 'ipv6' : 'ipv4';
  if (family === 'ipv4') {
    const mask = maskRaw ? Number(maskRaw) : 32;
    if (!Number.isInteger(mask) || mask < 0 || mask > 32) return null;
    const base = ipv4ToBigInt(normalizedIp);
    if (base === null) return null;
    return { family: 'ipv4', base, mask };
  }
  const mask = maskRaw ? Number(maskRaw) : 128;
  if (!Number.isInteger(mask) || mask < 0 || mask > 128) return null;
  const base = ipv6ToBigInt(normalizedIp);
  if (base === null) return null;
  return { family: 'ipv6', base, mask };
}

function loadTrustedCidrs(rawEnv?: string): TrustedCidr[] {
  const entries = rawEnv ? rawEnv.split(',') : DEFAULT_TRUSTED_PROXIES;
  const parsed: TrustedCidr[] = [];
  for (const entry of entries) {
    const cidr = parseCidr(entry);
    if (cidr) parsed.push(cidr);
  }
  return parsed;
}

let cachedTrustedCidrs: TrustedCidr[] | null = null;
let cachedEnvValue: string | undefined = undefined;

function getTrustedCidrs(): TrustedCidr[] {
  const currentEnv = process.env.TRUSTED_PROXIES;
  if (!cachedTrustedCidrs || cachedEnvValue !== currentEnv) {
    cachedTrustedCidrs = loadTrustedCidrs(currentEnv);
    cachedEnvValue = currentEnv;
  }
  return cachedTrustedCidrs;
}

function ipToBigInt(ip: string): { family: 'ipv4' | 'ipv6'; value: bigint } | null {
  const normalized = normalizeIp(ip);
  if (!normalized) return null;
  const family = net.isIP(normalized) === 6 ? 'ipv6' : 'ipv4';
  if (family === 'ipv4') {
    const val = ipv4ToBigInt(normalized);
    return val === null ? null : { family: 'ipv4', value: val };
  }
  const val = ipv6ToBigInt(normalized);
  return val === null ? null : { family: 'ipv6', value: val };
}

function isTrustedProxy(ip: string | null): boolean {
  if (!ip) return false;
  const parsed = ipToBigInt(ip);
  if (!parsed) return false;
  return getTrustedCidrs().some((cidr) => {
    if (cidr.family !== parsed.family) return false;
    const shift = (cidr.family === 'ipv4' ? 32 : 128) - cidr.mask;
    const mask = shift >= 0 ? (parsed.value >> BigInt(shift)) : parsed.value;
    const cidrBaseMasked = shift >= 0 ? cidr.base >> BigInt(shift) : cidr.base;
    return mask === cidrBaseMasked;
  });
}

function firstHeaderIp(headers: Request['headers'], keys: Array<'x-forwarded-for' | 'x-real-ip' | 'cf-connecting-ip'>): string | null {
  for (const key of keys) {
    const value = headers[key];
    if (!value) continue;
    if (Array.isArray(value)) {
      const first = value.find((v) => v && v.trim().length > 0);
      if (first) return normalizeIp(first.split(',')[0]);
      continue;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      return normalizeIp(value.split(',')[0]);
    }
  }
  return null;
}

function getRemoteAddress(req: Request): string | null {
  const socketIp = normalizeIp(req.socket?.remoteAddress);
  const reqIp = normalizeIp(typeof req.ip === 'string' ? req.ip : null);
  return socketIp || reqIp;
}

export function extractClientIp(req: Request): string | null {
  const remoteIp = getRemoteAddress(req);
  const trusted = isTrustedProxy(remoteIp);

  if (trusted) {
    const forwarded = firstHeaderIp(req.headers ?? {}, ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip']);
    if (forwarded) return forwarded;
  }

  return remoteIp;
}

function resolveRequestId(req: Request): string | null {
  const headers = req.headers ?? {};
  if (typeof req.id === 'string' && req.id.length > 0) {
    return req.id;
  }
  const headerId = headers['x-request-id'];
  if (typeof headerId === 'string' && headerId.length > 0) {
    return headerId;
  }
  return null;
}

export function buildAuditEvent(req: Request, event: BuildableAuditEvent): AuditLogEventInput {
  const actor = getRequestUser(req);
  const headers = req.headers ?? {};
  return {
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId ?? null,
    actorId: event.actorId ?? actor?.id ?? null,
    actorRole: event.actorRole ?? actor?.role ?? null,
    actorIp: event.actorIp ?? extractClientIp(req),
    requestId: event.requestId ?? resolveRequestId(req),
    userAgent: event.userAgent ?? normalizeUserAgent(headers['user-agent']),
    outcome: event.outcome ?? null,
    data: event.data ?? null,
    occurredAt: event.occurredAt ?? new Date(),
  };
}

export async function submitAuditEvent(req: Request, event: BuildableAuditEvent): Promise<void> {
  try {
    await logAuditEvent(buildAuditEvent(req, event));
  } catch (error) {
    logger.warn('Failed to submit audit event: %o', error);
  }
}

export function getAuditActorIp(req: Request): string | null {
  return extractClientIp(req);
}
