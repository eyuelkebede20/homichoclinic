import { NextResponse } from "next/server";
import { getVersionInfo } from "@/lib/version";

const processStartTime = Date.now();

/**
 * GET /api/version
 *
 * Authoritative endpoint for querying application version, git commit,
 * system uptime, and server time. Used by desktop/mobile wrappers,
 * update watchers, and health monitors.
 */
export async function GET() {
  const info = getVersionInfo();
  const uptimeSeconds = Math.floor((Date.now() - processStartTime) / 1000);
  const now = new Date().toISOString();

  return NextResponse.json(
    {
      name: info.name,
      version: info.version,
      gitCommit: info.gitCommit,
      buildTime: info.buildTime,
      displayVersion: info.displayVersion,
      environment: process.env.NODE_ENV || "development",
      uptime: uptimeSeconds,
      serverTime: now,
      status: "ok",
    },
    {
      status: 200,
      headers: {
        "X-App-Version": info.version,
        "X-Git-Commit": info.gitCommit,
        "X-Server-Time": now,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
