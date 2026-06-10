import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
const backendUrl = process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;
const cookieSecure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
const cookieSameSite = process.env.COOKIE_SAME_SITE ?? (process.env.NODE_ENV === 'production' ? 'none' : 'lax');

export default {
  port: Number(process.env.PORT ?? 4000),
  apiPrefix: '/api',
  jwtSecret: process.env.JWT_SECRET ?? 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '30d',
  dbUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/grammate',
  frontendUrl,
  backendUrl,
  cookieName: process.env.COOKIE_NAME ?? 'grammate_refresh',
  cookieSecure,
  cookieSameSite,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? `${backendUrl}/api/auth/google/callback`,
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL ?? 'evilmc777@gmail.com',
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD ?? 'SuperAdmin!123',
};
