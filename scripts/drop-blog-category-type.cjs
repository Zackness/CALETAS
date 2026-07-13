const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "BlogCategory" CASCADE;');
    console.log('BlogCategory table dropped');
    await prisma.$executeRawUnsafe('DROP TYPE IF EXISTS "BlogCategory";');
    console.log('BlogCategory type dropped successfully');
  } catch (e) {
    console.error('Failed to drop BlogCategory type:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
