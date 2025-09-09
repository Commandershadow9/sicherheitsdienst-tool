import type { RequestHandler } from 'express';
import crypto from 'crypto';

export default function requestId(): RequestHandler {
  return (req: any, res, next) => {
    const headerId = (req.headers['x-request-id'] as string) || '';
    const id = headerId && headerId.trim().length > 0 ? headerId.trim() : crypto.randomUUID();
    req.id = id;
    res.setHeader('X-Request-ID', id);
    next();
  };
}

