import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // 2. Define the staff we want to create
  const staffToCreate = [
    { role: "Admin", name: "Zenebe Admin" },
    { role: "Manager", name: "Fiseha Manager" },
    { role: "Doctor", name: ".Cashier" },
    { role: "Reception", name: "Rachel Reception" },
    { role: "Dataencoder", name: "Danny Dataencoder" },
    { role: "Laboratory", name: "Leo LabTech" },
    { role: "Pharmacy", name: "Penny Pharmacist" },
  ];

  for (const staff of staffToCreate) {
    const email = `${staff.role.toLowerCase()}@clinic.com`;

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

  // 3. Seed some basic Catalogs for testing (if they don't exist)

  // Drugs
  const drugs = [
    { name: "Amoxicillin 500mg", price: 1500 }, // $15.00
    { name: "Paracetamol 500mg", price: 500 }, // $5.00
    { name: "Ibuprofen 400mg", price: 800 }, // $8.00
  ];

  for (const d of drugs) {
    const existing = await prisma.drug.findFirst({ where: { name: d.name } });
    if (!existing) {
      const drug = await prisma.drug.create({ data: d });
      // Add a stock batch so Pharmacy can dispense it
      await prisma.stockBatch.create({
        data: {
          drugId: drug.id,
          batchNumber: `BATCH-${Math.floor(Math.random() * 1000)}`,
          expiryDate: new Date("2028-12-31"),
          quantity: 100,
          cost: Math.floor(d.price * 0.5),
        },
      });
      console.log(`Created Drug: ${d.name} & StockBatch`);
    }
  }

  // Lab Tests
  const tests = [
    { name: "Complete Blood Count (CBC)", price: 4500 }, // $45.00
    { name: "Lipid Panel", price: 6000 }, // $60.00
    { name: "Malaria Rapid Diagnostic", price: 2000 }, // $20.00
  ];

  for (const t of tests) {
    const existing = await prisma.labTest.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.labTest.create({ data: t });
      console.log(`Created LabTest: ${t.name}`);
    }
  }

  // 4. Seed a dummy Patient
  const existingPatient = await prisma.patient.findFirst({ where: { contactNumber: "555-0192" } });
  if (!existingPatient) {
    await prisma.patient.create({
      data: {
        firstName: "John",
        lastName: "Doe",
        gender: "male",
        yob: "1985",
        contactNumber: "555-0192",
        discountPercent: 10,
      },
    });
    console.log(`Created dummy Patient: John Doe`);
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
