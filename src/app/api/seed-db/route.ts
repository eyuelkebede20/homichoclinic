import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const staffToCreate = [
      { role: "Admin", name: "Alice Admin" },
      { role: "Manager", name: "Mark Manager" },
      { role: "Doctor", name: "Dr. Drake" },
      { role: "Reception", name: "Rachel Reception" },
      { role: "Dataencoder", name: "Danny Dataencoder" },
      { role: "Laboratory", name: "Leo LabTech" },
      { role: "Pharmacy", name: "Penny Pharmacist" },
    ];

    let createdCount = 0;

    for (const staff of staffToCreate) {
      const email = `${staff.role.toLowerCase()}@clinic.com`;
      const existingUser = await prisma.user.findFirst({ where: { email } });

      if (!existingUser) {
        // Register the user through Better Auth (handles hashing securely)
        await auth.api.signUpEmail({
          body: {
            email: email,
            password: "password123",
            name: staff.name,
          },
        });

        // Force assign the correct role
        await prisma.user.updateMany({
          where: { email },
          data: { role: staff.role },
        });
        createdCount++;
      }
    }

    // Seed dummy patient if empty
    const existingPatient = await prisma.patient.findFirst();
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
    }

    // Seed 3 default core lab tests if not present
    const defaultCoreTests = [
      { name: "Stool Examination", price: 5000, description: "Macroscopic, chemical occult & microscopic parasite examination" },
      { name: "Urine Examination", price: 5000, description: "Routine physical, chemical (dipstick) & microscopic sediment analysis" },
      { name: "Hematology", price: 10000, description: "Complete blood count (CBC), differential, indices, ESR & morphology" },
    ];

    for (const core of defaultCoreTests) {
      const exists = await prisma.labTest.findFirst({
        where: { name: { equals: core.name, mode: "insensitive" } }
      });
      if (!exists) {
        await prisma.labTest.create({
          data: {
            name: core.name,
            price: core.price,
            description: core.description,
            isOperational: true,
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded test users and core lab tests. You can now log in! Password is password123 for all.`,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
