/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getCurrentECYear() {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  
  if (month < 9 || (month === 9 && day < 11)) {
    return year - 8;
  }
  return year - 7;
}

function calculateDiscount(hiredYearEC: number | null, currentECYear: number): number {
  if (!hiredYearEC) return 50; 
  
  const yearsOfService = Math.max(0, currentECYear - hiredYearEC);
  
  if (yearsOfService >= 20) return 100;
  if (yearsOfService >= 15) return 75;
  if (yearsOfService >= 10) return 65;
  if (yearsOfService >= 6) return 55;
  return 50;
}

export async function GET(request: Request) {
  // We can add auth header check for Vercel Cron here
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentECYear = getCurrentECYear();
  let updatedStaff = 0;
  const updatedDependents = 0;

  try {
    // 1. Fetch all Civilian Staff
    const staffMembers = await prisma.patient.findMany({
      where: { patientType: "Civilian Staff" },
      select: { id: true, hiredYearEC: true, discountPercent: true }
    });

    // 2. Update their discounts if it changed
    for (const staff of staffMembers) {
      if (staff.hiredYearEC) {
        const newDiscount = calculateDiscount(staff.hiredYearEC, currentECYear);
        if (newDiscount !== staff.discountPercent) {
          await prisma.patient.update({
            where: { id: staff.id },
            data: { discountPercent: newDiscount }
          });
          updatedStaff++;
        }
      }
    }

    // 3. Dependents remain 95% always, but we ensure their parents' discounts are correct.
    // If dependents need updating we can do it here too, but they are hardcoded to 95%.

    return NextResponse.json({ 
      success: true, 
      currentECYear,
      updatedStaff 
    });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
