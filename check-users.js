const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function checkUsers() {
  const users = await prisma.user.findMany();
  console.log("Total users:", users.length);
  if (users.length > 0) {
    console.log("Sample user emails:", users.map(u => u.email).join(', '));
  }
}
checkUsers().catch(console.error).finally(() => prisma.$disconnect());
