import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import config from '../src/config.js';

const prisma = new PrismaClient();

async function main() {
  const email = config.superAdminEmail.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log('Super admin already exists:', email);
    return;
  }

  const passwordHash = await bcrypt.hash(config.superAdminPassword, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
      isSuperAdmin: true,
      username: 'superadmin',
      fullName: 'Default Super Admin',
      emailVerified: true,
    },
  });

  await prisma.wallet.create({ data: { userId: user.id } });

  console.log('Created default super admin:', email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
