import jwt from 'jsonwebtoken';
import config from '../config.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cache for Google/Firebase public certificates
let googleCertificatesCache = null;
let googleCertificatesExpiry = 0;

/**
 * Fetches Google's public certificates used to sign Firebase ID tokens.
 * Caches the response based on Cache-Control headers to ensure high performance.
 */
async function fetchGoogleCertificates() {
  const now = Date.now();
  if (googleCertificatesCache && now < googleCertificatesExpiry) {
    return googleCertificatesCache;
  }

  try {
    const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken-system@system.gserviceaccount.com');
    if (!res.ok) throw new Error('Failed to fetch Google public keys');

    const cacheControl = res.headers.get('cache-control') || '';
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) * 1000 : 3600000;

    googleCertificatesCache = await res.json();
    googleCertificatesExpiry = now + maxAge;
    return googleCertificatesCache;
  } catch (err) {
    console.error('[AuthMiddleware] Error fetching Google public keys:', err);
    if (googleCertificatesCache) return googleCertificatesCache; // fallback
    throw err;
  }
}

/**
 * Verifies a Firebase ID token using Google's public certificates.
 */
async function verifyFirebaseToken(token) {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header || !decoded.header.kid) {
    throw new Error('Invalid token format or missing key ID (kid)');
  }

  const certs = await fetchGoogleCertificates();
  const cert = certs[decoded.header.kid];
  if (!cert) {
    throw new Error(`Public key not found for kid: ${decoded.header.kid}`);
  }

  const projectId = 'evil-2e175';
  const payload = jwt.verify(token, cert, {
    algorithms: ['RS256'],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  });

  return payload;
}

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    let payload = null;
    let isFirebase = false;

    // Decode to inspect issuer to determine if it is a Firebase token or local JWT
    const decoded = jwt.decode(token);
    if (decoded && decoded.iss && decoded.iss.includes('securetoken.google.com')) {
      isFirebase = true;
    }

    let email = null;
    let userId = null;
    let name = '';
    let picture = '';
    let emailVerified = false;

    if (isFirebase) {
      // Verify Firebase ID Token
      payload = await verifyFirebaseToken(token);
      email = payload.email;
      userId = payload.sub; // Firebase unique UID
      name = payload.name || '';
      picture = payload.picture || '';
      emailVerified = !!payload.email_verified;
    } else {
      // Fallback: Verify local legacy JWT (useful for local development, seeds, and testing)
      payload = jwt.verify(token, config.jwtSecret);
      userId = payload.sub;
    }

    let user = null;

    if (email) {
      // Find or dynamically provision the user from the Firebase profile
      user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true, isSuperAdmin: true, email: true, username: true },
      });

      if (!user) {
        let cleanUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
        if (cleanUsername.length < 3) {
          cleanUsername = 'user_' + Math.random().toString(36).substring(2, 7);
        }

        const existingUserByUsername = await prisma.user.findUnique({
          where: { username: cleanUsername },
        });
        if (existingUserByUsername) {
          cleanUsername = `${cleanUsername}_${Math.random().toString(36).substring(2, 5)}`;
        }

        const isAdminEmail = email.toLowerCase() === 'evilmc777@gmail.com';
        const userRole = isAdminEmail ? 'ADMIN' : 'VIEWER';

        user = await prisma.user.create({
          data: {
            id: userId, // Keep DB ID identical to Firebase UID
            email,
            username: cleanUsername,
            fullName: name,
            avatarUrl: picture,
            role: userRole,
            isSuperAdmin: isAdminEmail,
            emailVerified,
          },
          select: { id: true, role: true, isSuperAdmin: true, email: true, username: true },
        });
      }
    } else {
      // Legacy user retrieval via ID
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, isSuperAdmin: true, email: true, username: true },
      });
    }

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Authentication failure:', error.message);
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

    // Case-insensitive administrator check.
    // Strictly restrict 'admin' / 'ADMIN' privileges to evilmc777@gmail.com.
    const hasAdminRequest = allowedRoles.some((role) => role.toLowerCase() === 'admin');
    if (hasAdminRequest) {
      if (req.user.email !== 'evilmc777@gmail.com') {
        return res.status(403).json({ message: 'Forbidden: Administrator privileges required.' });
      }
      return next();
    }

    // Match uppercase or lowercase database roles
    const userRole = req.user.role.toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map((role) => role.toUpperCase());

    if (allowedRoles.length > 0 && !normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
}
