import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { exec } from "child_process";
import util from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = util.promisify(exec);

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  
  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
  
  // Ensure only Admin or Manager can backup
  if (role !== "Admin" && role !== "Manager") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return new NextResponse("DATABASE_URL is not set.", { status: 500 });
  }

  // Remove prisma specific query params like ?schema=public
  const urlParts = databaseUrl.split("?");
  databaseUrl = urlParts[0];

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `homichoclinic_backup_${timestamp}.sql`;
  const tmpFilePath = path.join(os.tmpdir(), fileName);

  try {
    // Run pg_dump
    await execAsync(`pg_dump "${databaseUrl}" -F p -f "${tmpFilePath}"`);
    
    // Read the file
    const fileBuffer = await fs.readFile(tmpFilePath);
    
    // Clean up
    await fs.unlink(tmpFilePath).catch(() => {});

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/sql",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      }
    });

  } catch (error: any) {
    console.error("Backup failed:", error);
    await fs.unlink(tmpFilePath).catch(() => {});
    return new NextResponse("Database backup failed: " + error.message, { status: 500 });
  }
}
