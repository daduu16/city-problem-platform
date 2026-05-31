const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.user.count();
    process.stdout.write(String(count));
    process.exit(count === 0 ? 0 : 2);
  } catch {
    process.stdout.write('0');
    process.exit(0);
  } finally {
    await prisma.$disconnect();
  }
}

main();
