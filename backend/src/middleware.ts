import { Request, Response, NextFunction } from 'express';

import { verifyToken } from './auth.js';

export type AuthedRequest = Request & { userId?: string };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tələb olunur' });
  }

  try {
    const token = header.replace('Bearer ', '');
    const payload = verifyToken(token);
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ message: 'Token etibarsızdır' });
  }
}

