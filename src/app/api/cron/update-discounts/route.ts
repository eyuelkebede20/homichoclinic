/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  // Simple cron endpoint to recalculate all civilian staff discounts on Ethiopian New Year
  // In production, you would protect this with a secure token:
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return new Response('Unauthorized', { status: 401 });

  try {
    const patients = await prisma.patient.findMany({
      where: {
        permanentSince: { not: null },
        relationship: "Staff" // Only recalculate for staff
      }
    });

    let updatedCount = 0;

    for (const patient of patients) {
      if (!patient.permanentSince) continue;
      
      const pDate = new Date(patient.permanentSince);
      if (isNaN(pDate.getTime())) continue;

      const now = new Date();
      let yearsOfService = now.getFullYear() - pDate.getFullYear();
      const m = now.getMonth() - pDate.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < pDate.getDate())) {
        yearsOfService--;
      }
      yearsOfService = Math.max(0, yearsOfService);

      let newDiscount = 50;
      if (yearsOfService >= 20) newDiscount = 100;
      else if (yearsOfService >= 15) newDiscount = 75;
      else if (yearsOfService >= 10) newDiscount = 65;
      else if (yearsOfService >= 6) newDiscount = 55;

      if (patient.discountPercent !== newDiscount) {
        await prisma.patient.update({
          where: { id: patient.id },
          data: { discountPercent: newDiscount }
        });
        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, message: `Successfully recalculated discounts. Updated ${updatedCount} staff members.` });
  } catch (error: unknown) {
    console.error("Cronjob error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
