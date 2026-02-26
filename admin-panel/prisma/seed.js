/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('adminpassword', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@seo.local' },
    update: {},
    create: {
      email: 'admin@seo.local',
      passwordHash,
      name: 'Super Admin',
      role: 'ADMIN',
    },
  });

  console.log('Seed completed. Admin user:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
