import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import fs from "fs";

const STATUS_FILE = "/run/updater/update.status";

/**
 * GET /api/update-status
 *
 * Returns the live contents of run/update.status written by update.sh.
 * The file is mounted into the container via the compose volume ./run:/run/updater.
 *
 * The UI polls this every 2s while in the "updating" phase to show
 * real-time progress (backup, git pull, build, health wait, done/rollback).
 *
 * Auth: Admin or Manager only — same gate as the backup route.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const role = session.user.role ?? "User";
  if (role !== "Admin" && role !== "Manager") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // File doesn't exist yet (no update ever triggered, or first boot)
  if (!fs.existsSync(STATUS_FILE)) {
    return NextResponse.json({ lines: [], done: false });
  }

  try {
    const raw = fs.readFileSync(STATUS_FILE, "utf-8");
    const lines = raw.split("\n").filter(Boolean);

    // "done" or "rollback" markers written by update.sh on exit
    const done =
      lines.some((l) => l.includes("✅ Update complete")) ||
      lines.some((l) => l.includes("Rollback complete"));

    const failed = lines.some((l) => l.includes("Rollback complete"));

    return NextResponse.json({ lines, done, failed });
  } catch {
    return NextResponse.json({ lines: [], done: false, failed: false });
  }
}
