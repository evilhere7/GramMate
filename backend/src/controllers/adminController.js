import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getAnalytics(req, res) {
  const userCount = await prisma.user.count();
  const activeCreators = await prisma.user.count({ where: { role: { in: ['CREATOR', 'ADMIN', 'MODERATOR', 'SUPER_ADMIN'] } } });
  const videoCount = await prisma.video.count();
  const transactionVolume = await prisma.transaction.aggregate({ _sum: { amountCents: true } });
  const openTickets = await prisma.supportTicket.count({ where: { status: 'open' } });

  return res.json({
    users: userCount,
    activeCreators,
    videos: videoCount,
    transactionVolume: transactionVolume._sum.amountCents ?? 0,
    openTickets,
  });
}

export async function listAuditLogs(req, res) {
  const page = Number(req.query.page || 1);
  const take = 25;
  const skip = (page - 1) * take;
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });
  const total = await prisma.auditLog.count();
  return res.json({ logs, meta: { page, total, pageSize: take } });
}

export async function listSupportTickets(req, res) {
  const tickets = await prisma.supportTicket.findMany({ orderBy: { updatedAt: 'desc' }, take: 50 });
  return res.json({ tickets });
}

export async function getSettings(req, res) {
  const settings = await prisma.setting.findMany();
  return res.json({ settings });
}

export async function updateSetting(req, res) {
  const { key, value } = req.body;
  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  return res.json({ setting });
}
