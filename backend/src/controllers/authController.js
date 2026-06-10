import { PrismaClient } from '@prisma/client';
import config from '../config.js';
import {
  createAccessToken,
  createSession,
  verifyPassword,
  hashPassword,
  rotateSession,
  revokeSession,
  createPasswordResetToken,
  verifyPasswordResetToken,
  consumePasswordResetToken,
} from '../services/authService.js';
import { audit } from '../services/auditService.js';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validation.js';

const prisma = new PrismaClient();

function setRefreshCookie(res, token, expiresAt) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/api',
  });
}

export async function register(req, res) {
  const payload = registerSchema.parse(req.body);
  const existingEmail = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
  if (existingEmail) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const existingUsername = await prisma.user.findUnique({ where: { username: payload.username } });
  if (existingUsername) {
    return res.status(409).json({ message: 'Username already exists' });
  }

  const passwordHash = await hashPassword(payload.password);
  const user = await prisma.user.create({
    data: {
      email: payload.email.toLowerCase(),
      passwordHash,
      username: payload.username,
      fullName: payload.fullName,
      emailVerified: false,
      role: 'VIEWER',
    },
  });

  await prisma.wallet.create({ data: { userId: user.id } });
  await audit({ actorId: user.id, entityType: 'user', entityId: user.id, action: 'user.registered' });

  const accessToken = createAccessToken(user);
  const session = await createSession(user.id);
  setRefreshCookie(res, session.refreshToken, session.expiresAt);

  return res.status(201).json({ accessToken, user: { id: user.id, email: user.email, role: user.role, username: user.username, fullName: user.fullName } });
}

export async function login(req, res) {
  const payload = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
  if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const accessToken = createAccessToken(user);
  const session = await createSession(user.id);
  setRefreshCookie(res, session.refreshToken, session.expiresAt);
  await audit({ actorId: user.id, entityType: 'user', entityId: user.id, action: 'user.logged_in' });

  return res.json({ accessToken, user: { id: user.id, email: user.email, role: user.role, username: user.username, fullName: user.fullName } });
}

export async function refreshToken(req, res) {
  const token = req.cookies[config.cookieName];
  if (!token) {
    return res.status(401).json({ message: 'Missing refresh token' });
  }

  const rotated = await rotateSession(token);
  if (!rotated) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  const user = await prisma.user.findUnique({ where: { id: rotated.userId } });
  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }

  const accessToken = createAccessToken(user);
  setRefreshCookie(res, rotated.refreshToken, rotated.expiresAt);

  return res.json({ accessToken, user: { id: user.id, email: user.email, role: user.role, username: user.username, fullName: user.fullName } });
}

export async function logout(req, res) {
  const token = req.cookies[config.cookieName];
  if (token) {
    await revokeSession(token);
  }
  res.clearCookie(config.cookieName, { path: '/api' });
  return res.json({ message: 'Logged out' });
}

export async function forgotPassword(req, res) {
  const { email } = forgotPasswordSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (user) {
    const reset = await createPasswordResetToken(user.id);
    // TODO: wire actual email service in production
    console.log('Password reset token:', reset.token);
    await audit({ actorId: user.id, entityType: 'user', entityId: user.id, action: 'user.requested_password_reset' });
  }

  return res.json({ message: 'If an account exists, a password reset email has been sent.' });
}

export async function resetPassword(req, res) {
  const { token, password } = resetPasswordSchema.parse(req.body);
  const reset = await verifyPasswordResetToken(token);
  if (!reset) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  await prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: await hashPassword(password) } });
  await consumePasswordResetToken(token);
  await audit({ actorId: reset.userId, entityType: 'user', entityId: reset.userId, action: 'user.password_reset' });

  return res.json({ message: 'Password updated successfully.' });
}

export async function getProfile(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, email: true, username: true, fullName: true, role: true, bio: true, avatarUrl: true, emailVerified: true, createdAt: true } });
  return res.json({ user });
}
