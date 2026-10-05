import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/health
 *
 * Used by the Docker compose healthcheck and by the admin "Update" UI
 * to poll for app readiness after an update.
 *
 * Returns 200 { ok: true } when the app AND database are reachable.
 * Returns 503 { ok: false } otherwise.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "db_unreachable" }, { status: 503 });
  }
}
