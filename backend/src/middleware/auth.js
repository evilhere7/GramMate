import jwt from 'jsonwebtoken';
import config from '../config.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isSuperAdmin: true, email: true, username: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    // Strictly restrict 'admin' role to evilmc777@gmail.com
    if (allowedRoles.includes('admin')) {
      if (req.user.email !== 'evilmc777@gmail.com') {
        return res.status(403).json({ message: 'Forbidden: Administrator privileges required.' });
      }
      return next();
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
}
