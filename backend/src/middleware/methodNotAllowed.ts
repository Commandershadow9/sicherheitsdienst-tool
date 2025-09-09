import type { RequestHandler } from 'express';

export default function methodNotAllowed(allowed: string[]): RequestHandler {
  const allowHeader = allowed.join(', ');
  return (_req, res) => {
    res.setHeader('Allow', allowHeader);
    res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'HTTP-Methode wird auf dieser Ressource nicht unterstützt.' });
  };
}

