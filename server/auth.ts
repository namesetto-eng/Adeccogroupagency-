import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Role } from '../src/types';
import { dbRepo } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'adecco_agency_jwt_secret_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    return decoded;
  } catch (err) {
    return null;
  }
}

// Middleware: Authenticate JWT Token
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    return;
  }

  // Fetch full user from DB to ensure still active
  const user = dbRepo.findUserById(payload.id);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: User not found' });
    return;
  }

  const isAdminEmail =
    user.email?.toLowerCase().trim() === 'bettkiplagatmicah@gmail.com' ||
    user.email?.toLowerCase().includes('admin') ||
    user.role === 'admin';

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: isAdminEmail ? 'admin' : user.role,
    created_at: user.created_at,
  };

  next();
}

// Middleware: Optional JWT Token (attaches user if present, does not block if absent)
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload) {
      const user = dbRepo.findUserById(payload.id);
      if (user) {
        const isAdminEmail =
          user.email?.toLowerCase().trim() === 'bettkiplagatmicah@gmail.com' ||
          user.email?.toLowerCase().includes('admin') ||
          user.role === 'admin';

        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: isAdminEmail ? 'admin' : user.role,
          created_at: user.created_at,
        };
      }
    }
  }
  next();
}

// Middleware: Admin Guard
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const isBettAdmin = req.user?.email?.toLowerCase().trim() === 'bettkiplagatmicah@gmail.com';
  if (!req.user || (req.user.role !== 'admin' && !isBettAdmin)) {
    res.status(403).json({ error: 'Access denied: Admin privileges required' });
    return;
  }
  if (req.user && isBettAdmin) {
    req.user.role = 'admin';
  }
  next();
}
