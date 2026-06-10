import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
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
const oauthClient = new OAuth2Client({
  clientId: config.googleClientId,
  clientSecret: config.googleClientSecret,
  redirectUri: config.googleRedirectUri,
});

function safeRedirectPath(path = '/') {
  if (typeof path !== 'string') return '/';
  if (path.startsWith('/') && !path.startsWith('//') && !path.includes('\n') && !path.includes('\r')) {
    return path;
  }
  return '/';
}

function createCallbackPage(status, redirectTo, message = '') {
  const safeRedirect = `${config.frontendUrl}${safeRedirectPath(redirectTo)}`;
  const encodedMessage = encodeURIComponent(message);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GramMate authentication complete</title>
  </head>
  <body>
    <script>
      const payload = ${JSON.stringify({ status: 'success', redirectTo: safeRedirect, message })};
      if (window.opener && window.opener.postMessage) {
        window.opener.postMessage({ type: 'GRAMMATE_GOOGLE_AUTH', ...payload }, '*');
        window.location.href = payload.redirectTo;
      } else {
        window.location.href = payload.redirectTo;
      }
    </script>
    <noscript>
      <meta http-equiv="refresh" content="0;url=${safeRedirect}" />
      <p>Redirecting to GramMate...</p>
    </noscript>
  </body>
</html>`;
}

async function resolveGoogleUser(payload) {
  const email = payload.email?.toLowerCase();
  if (!email) {
    return null;
  }

  const existingByGoogleId = payload.sub
    ? await prisma.user.findUnique({ where: { googleId: payload.sub } })
    : null;

  if (existingByGoogleId) {
    return existingByGoogleId;
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) {
    if (existingByEmail.googleId && existingByEmail.googleId !== payload.sub) {
      return null;
    }

    return await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        googleId: payload.sub,
        emailVerified: true,
        avatarUrl: existingByEmail.avatarUrl || payload.picture,
        fullName: existingByEmail.fullName || payload.name,
      },
    });
  }

  const baseUsername = (email.split('@')[0] || 'grammate').replace(/[^a-zA-Z0-9_]/g, '');
  let uniqueUsername = baseUsername || 'grammate';
  let suffix = 0;
  while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
    suffix += 1;
    uniqueUsername = `${baseUsername}${suffix}`;
  }

  const user = await prisma.user.create({
    data: {
      email,
      googleId: payload.sub,
      username: uniqueUsername,
      fullName: payload.name,
      avatarUrl: payload.picture,
      emailVerified: true,
      role: 'VIEWER',
    },
  });

  await prisma.wallet.create({ data: { userId: user.id } });
  return user;
}

function setRefreshCookie(res, token, expiresAt) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    expires: expiresAt,
    path: '/api',
  });
}

export async function startGoogleAuth(req, res) {
  if (!config.googleClientId || !config.googleClientSecret) {
    return res.status(500).json({ message: 'Google OAuth is not configured' });
  }

  const redirectTo = safeRedirectPath(req.query.redirectTo || '/');
  const state = crypto.randomBytes(24).toString('hex');

  res.cookie('google_oauth_state', state, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    maxAge: 1000 * 60 * 10,
    path: '/api',
  });
  res.cookie('google_oauth_redirect', redirectTo, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    maxAge: 1000 * 60 * 10,
    path: '/api',
  });

  const authorizationUrl = oauthClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'select_account',
    scope: ['openid', 'email', 'profile'],
    state,
  });

  return res.redirect(authorizationUrl);
}

export async function googleAuthCallback(req, res) {
  const { code, state, error, error_description } = req.query;
  const stateCookie = req.cookies.google_oauth_state;
  const redirectTo = safeRedirectPath(req.cookies.google_oauth_redirect || '/');

  res.clearCookie('google_oauth_state', { path: '/api' });
  res.clearCookie('google_oauth_redirect', { path: '/api' });

  if (error) {
    return res.status(400).send(createCallbackPage('error', redirectTo, error_description || error));
  }

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return res.status(400).send(createCallbackPage('error', redirectTo, 'Google authentication failed or was cancelled.'));
  }

  const tokenResponse = await oauthClient.getToken(code);
  const idToken = tokenResponse.tokens.id_token;
  if (!idToken) {
    return res.status(500).send(createCallbackPage('error', redirectTo, 'Failed to validate Google login.'));
  }

  const ticket = await oauthClient.verifyIdToken({ idToken, audience: config.googleClientId });
  const payload = ticket.getPayload();
  if (!payload) {
    return res.status(500).send(createCallbackPage('error', redirectTo, 'Google identity verification failed.'));
  }

  const user = await resolveGoogleUser(payload);
  if (!user) {
    return res.status(403).send(createCallbackPage('error', redirectTo, 'Unable to link Google account with this email.'));
  }

  const accessToken = createAccessToken(user);
  const session = await createSession(user.id);
  setRefreshCookie(res, session.refreshToken, session.expiresAt);
  await audit({ actorId: user.id, entityType: 'user', entityId: user.id, action: 'user.google_authenticated' });

  return res.send(createCallbackPage('success', redirectTo, 'Authentication complete.'));
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
      role: payload.role ?? 'VIEWER',
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
  if (!user || !user.passwordHash || !(await verifyPassword(payload.password, user.passwordHash))) {
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
