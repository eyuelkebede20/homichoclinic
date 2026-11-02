import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVersionInfo } from "@/lib/version";

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
  const versionInfo = getVersionInfo();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { ok: true, version: versionInfo.version, commit: versionInfo.gitCommit },
      {
        status: 200,
        headers: {
          "X-App-Version": versionInfo.version,
          "X-Git-Commit": versionInfo.gitCommit,
          "X-Server-Time": new Date().toISOString(),
        },
      }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "db_unreachable", version: versionInfo.version },
      {
        status: 503,
        headers: {
          "X-App-Version": versionInfo.version,
        },
      }
    );
  }
}
