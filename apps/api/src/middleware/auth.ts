import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  userId: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // Extend the User interface so passport and our JWT middleware share the same type
    interface User extends AuthPayload {}
  }
}

export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header.', retryable: false },
    });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || '') as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      error: { code: 'TOKEN_EXPIRED', message: 'Session token is invalid or expired.', retryable: false },
    });
  }
}
