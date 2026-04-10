import dotenv from 'dotenv';
dotenv.config();
import prisma from '../lib/prisma';

async function run() {
  const user = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'anonymous@culinarycompass.app',
      displayName: 'Community Member',
      subscriptionStatus: 'trial',
    },
    update: {},
  });
  console.log('Anonymous user ready:', user.id);
  await prisma.$disconnect();
}

run().catch(e => { console.error(e.message); process.exit(1); });
