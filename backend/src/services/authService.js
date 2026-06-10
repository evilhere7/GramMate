import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import config from '../config.js';

const prisma = new PrismaClient();

export function createAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, isSuperAdmin: user.isSuperAdmin },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function createRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

export async function createSession(userId) {
  const refreshToken = createRefreshToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await prisma.session.create({
    data: { userId, refreshToken, expiresAt },
  });
  return { refreshToken, expiresAt };
}

export async function rotateSession(oldToken) {
  const existing = await prisma.session.findUnique({ where: { refreshToken: oldToken } });
  if (!existing || existing.expiresAt < new Date()) {
    return null;
  }
  const refreshToken = createRefreshToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await prisma.session.update({
    where: { refreshToken: oldToken },
    data: { refreshToken, expiresAt },
  });
  return { refreshToken, expiresAt, userId: existing.userId };
}

export async function revokeSession(refreshToken) {
  await prisma.session.deleteMany({ where: { refreshToken } });
}

export async function createPasswordResetToken(userId) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
  return prisma.passwordReset.create({
    data: { userId, token, expiresAt },
  });
}

export async function verifyPasswordResetToken(token) {
  return prisma.passwordReset.findFirst({ where: { token, expiresAt: { gte: new Date() } } });
}

export async function consumePasswordResetToken(token) {
  return prisma.passwordReset.deleteMany({ where: { token } });
}
