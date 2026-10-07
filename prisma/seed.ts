import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // 2. Define the staff we want to create
  const staffToCreate = [
    { role: "Doctor", name: "Senayt Tadesse", email: "senayt@clinic.com" },
    { role: "Doctor", name: "Tsegneh Tirfe", email: "tsegineh@clinic.com" },
    { role: "Doctor", name: "Miliyon Mideksa", email: "miliyon@clinic.com" },
    { role: "Doctor", name: "Fiseha Muleta", email: "fiseha@clinic.com" },
    { role: "Pharmacy", name: "Anteneh Getachew", email: "anteneh@clinic.com" },
    { role: "Laboratory", name: "Dula Tulu", email: "dula@clinic.com" },
    { role: "Laboratory", name: "Girma Kaba", email: "girma@clinic.com" },
    { role: "Reception", name: "Marta Kumsa", email: "marta@clinic.com" },
    { role: "Dataencoder", name: "Aynalem", email: "aynalem@clinic.com" },
    { role: "Admin", name: "System Admin", email: "admin@clinic.com" } // Keeping an admin just in case
  ];

  for (const staff of staffToCreate) {
    const email = staff.email;

    // Check if exists
    const existingUser = await prisma.user.findFirst({ where: { email } });

    if (!existingUser) {
      try {
        // Use better-auth natively so it handles the complex hashing correctly
        await auth.api.signUpEmail({
          body: {
            email: email,
            password: "password123",
            name: staff.name,
          },
        });

        // Force the role assignment if our hooks didn't catch it correctly for seed script
        await prisma.user.updateMany({
          where: { email },
          data: { role: staff.role },
        });

        console.log(`Created user: ${email} (Role: ${staff.role})`);
      } catch (e) {
        console.error(`Failed to create ${email}:`, e);
      }
    } else {
      console.log(`User ${email} already exists. Skipping.`);
    }
  }

  console.log("Seed completed successfully! Password for all accounts is: password123");
}

main()
  .catch((e) => {
    console.error("Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
