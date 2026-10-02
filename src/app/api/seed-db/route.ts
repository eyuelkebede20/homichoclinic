/* eslint-disable @typescript-eslint/no-explicit-any */
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
      { role: "Cashier", name: "Charlie Cashier" },
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
            name: staff.name
          }
        });
        
        // Force assign the correct role
        await prisma.user.updateMany({
          where: { email },
          data: { role: staff.role }
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
          dob: "1985",
          contactNumber: "555-0192",
          discountPercent: 10,
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Seeded ${createdCount} new test users. You can now log in! Password is password123 for all.`,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
