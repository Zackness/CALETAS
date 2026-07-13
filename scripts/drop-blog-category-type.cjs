const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe('DROP TYPE IF EXISTS "BlogCategory" CASCADE;');
    console.log('BlogCategory type dropped successfully');
  } catch (e) {
    console.error('Failed to drop BlogCategory type:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
