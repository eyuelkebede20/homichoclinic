import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStartOfDayLocal } from "@/lib/date-utils";

export async function POST(request: Request) {
  // Protect the route using a secret token in headers or query params
  const authHeader = request.headers.get("authorization");
  if (authHeader !== "Bearer " + process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const today = getStartOfDayLocal();

  // Find all visits that are still active from BEFORE today
  // Wait, no. We just expire all "scheduled" and "in_progress" visits 
  // that were created/scheduled before today.
  
  const updated = await prisma.visit.updateMany({
    where: {
      status: { in: ["scheduled", "in_progress"] },
      visitDate: { lt: today }
    },
    data: {
      status: "expired"
    }
  });

  return NextResponse.json({ success: true, expiredCount: updated.count });
}