import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  fullName: z.string().min(1).max(80).optional(),
  role: z.enum(['VIEWER', 'CREATOR']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().uuid(),
  password: z.string().min(8).max(128),
});

export const updateProfileSchema = z.object({
  fullName: z.string().max(80).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(240).optional(),
  avatarUrl: z.string().url().optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['VIEWER', 'CREATOR', 'ADMIN', 'MODERATOR', 'SUPER_ADMIN']),
});

export const videoSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(1000).optional(),
  category: z.string().max(60).optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED', 'SCHEDULED', 'PRIVATE']).optional(),
});
