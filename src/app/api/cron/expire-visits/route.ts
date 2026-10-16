import { NextResponse } from "next/server";
import { autoResetExpiredOpdVisits } from "@/features/clinical/actions";

export async function POST(request: Request) {
  // Protect the route using a secret token in headers or query params
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== "Bearer " + process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Automatically reset all visits older than 1 day to null and cancel them
  const expiredCount = await autoResetExpiredOpdVisits();

  return NextResponse.json({ success: true, expiredCount });
}