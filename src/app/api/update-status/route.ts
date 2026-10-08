import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import fs from "fs";
import path from "path";

const STATUS_FILE = "/run/updater/update.status";

/**
 * GET /api/update-status
 *
 * Returns the live contents of run/update.status written by update.sh or UPDATE.bat.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const role = session.user.role ?? "User";
  if (role !== "Admin" && role !== "Manager") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let fileToRead = STATUS_FILE;
  const localStatusFile = path.join(process.cwd(), "run", "update.status");
  
  if (fs.existsSync(localStatusFile)) {
    fileToRead = localStatusFile;
  } else if (!fs.existsSync(STATUS_FILE)) {
    return NextResponse.json({ lines: [], done: false });
  }

  try {
    const raw = fs.readFileSync(fileToRead, "utf-8");
    const lines = raw.split("\n").filter(Boolean);

    const done =
      lines.some((l) => l.includes("Update complete") || l.includes("UPDATE COMPLETE SUCCESSFULLY!")) ||
      lines.some((l) => l.includes("Rollback complete"));

    const failed = lines.some((l) => l.includes("Rollback complete"));

    return NextResponse.json({ lines, done, failed });
  } catch {
    return NextResponse.json({ lines: [], done: false, failed: false });
  }
}
