import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export default function requestId() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const headerId = (req.headers['x-request-id'] as string) || '';
    const id = headerId && headerId.trim().length > 0 ? headerId.trim() : crypto.randomUUID();
    req.id = id;
    res.setHeader('X-Request-ID', id);
    next();
  };
}

