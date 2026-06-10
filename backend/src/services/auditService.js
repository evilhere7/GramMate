import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function audit({ actorId, entityType, entityId, action, beforeState, afterState }) {
  return prisma.auditLog.create({
    data: {
      actorId,
      entityType,
      entityId,
      action,
      beforeState,
      afterState,
    },
  });
}
