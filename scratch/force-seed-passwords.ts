import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("Wiping all existing users, accounts, and sessions...");
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  console.log("Wipe complete!");

  const staffToCreate = [
    { role: 'Admin', name: 'Alice Admin' },
    { role: 'Manager', name: 'Mark Manager' },
    { role: 'Doctor', name: 'Dr. Drake' },
    { role: 'Reception', name: 'Rachel Reception' },
    { role: 'Cashier', name: 'Charlie Cashier' },
    { role: 'Laboratory', name: 'Leo LabTech' },
    { role: 'Pharmacy', name: 'Penny Pharmacist' },
  ];

  for (const staff of staffToCreate) {
    const email = `${staff.role.toLowerCase()}@clinic.com`;
    console.log(`\nCreating ${email} via Better Auth...`);
    
    try {
      // 1. Let Better Auth natively create the user and hash the password correctly
      const res = await auth.api.signUpEmail({
        body: {
          email: email,
          password: 'password123',
          name: staff.name
        }
      });
      
      console.log(`Success! Better Auth created user ID: ${res.user.id}`);

      // 2. Force update their role in Prisma (since Better Auth signUpEmail might default them to 'User')
      await prisma.user.update({
        where: { id: res.user.id },
        data: { role: staff.role }
      });
      console.log(`Updated role to: ${staff.role}`);
      
    } catch (e) {
      console.error(`FAILED to create ${email}:`, e);
    }
  }

  console.log("\nAll passwords seeded! Every account uses 'password123'");
}

main().catch(console.error).finally(() => prisma.$disconnect());
