import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.update({
    where: { email: 'doctor@clinic.com' },
    data: { currentOpdRoom: 2 }
  });
  console.log("Updated:", user);
}
test().finally(() => prisma.$disconnect());
