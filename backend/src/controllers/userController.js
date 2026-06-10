import { PrismaClient } from '@prisma/client';
import { audit } from '../services/auditService.js';
import { updateProfileSchema, updateUserRoleSchema } from '../utils/validation.js';

const prisma = new PrismaClient();

export async function getMe(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, username: true, fullName: true, role: true, bio: true, avatarUrl: true, createdAt: true },
  });
  return res.json({ user });
}

export async function updateMe(req, res) {
  const payload = updateProfileSchema.parse(req.body);

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: payload,
  });

  await audit({ actorId: req.user.id, entityType: 'user', entityId: updated.id, action: 'user.updated_profile', afterState: payload });

  return res.json({ user: updated });
}

export async function listUsers(req, res) {
  const page = Number(req.query.page || 1);
  const take = 20;
  const skip = (page - 1) * take;
  const users = await prisma.user.findMany({
    select: { id: true, email: true, username: true, fullName: true, role: true, isSuperAdmin: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });
  const total = await prisma.user.count();
  return res.json({ users, meta: { page, total, pageSize: take } });
}

export async function getUser(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.params.userId },
    select: { id: true, email: true, username: true, fullName: true, role: true, bio: true, avatarUrl: true, isSuperAdmin: true, createdAt: true },
  });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.json({ user });
}

export async function updateUserRole(req, res) {
  const { role } = updateUserRoleSchema.parse(req.body);
  const targetId = req.params.userId;
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (target.isSuperAdmin) {
    return res.status(403).json({ message: 'Cannot modify the default super admin account' });
  }

  const updated = await prisma.user.update({ where: { id: targetId }, data: { role } });
  await audit({ actorId: req.user.id, entityType: 'user', entityId: updated.id, action: 'admin.updated_user_role', beforeState: { role: target.role }, afterState: { role } });
  return res.json({ user: updated });
}

export async function deleteUser(req, res) {
  const target = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!target) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (target.isSuperAdmin) {
    return res.status(403).json({ message: 'Cannot delete the default super admin account' });
  }
  await prisma.user.delete({ where: { id: target.id } });
  await audit({ actorId: req.user.id, entityType: 'user', entityId: target.id, action: 'admin.deleted_user' });
  return res.json({ message: 'User deleted' });
}
