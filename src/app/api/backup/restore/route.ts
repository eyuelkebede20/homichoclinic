import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ROLE_PERMISSIONS } from "@/lib/permissions";
import { exec } from "child_process";
import util from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = util.promisify(exec);

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  
  const role = session.user.role || "User";
  if (role !== "Admin" && role !== "Manager") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return new NextResponse("DATABASE_URL is not set.", { status: 500 });
  }

  // Remove prisma specific query params
  const urlParts = databaseUrl.split("?");
  databaseUrl = urlParts[0];

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return new NextResponse("No file provided.", { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Determine format by file extension or content type
    const isSql = file.name.endsWith(".sql");
    const tmpFilePath = path.join(os.tmpdir(), `restore_${Date.now()}.${isSql ? 'sql' : 'backup'}`);
    
    await fs.writeFile(tmpFilePath, buffer);

    try {
      if (isSql) {
        await execAsync(`psql -d "${databaseUrl}" -f "${tmpFilePath}"`);
      } else {
        await execAsync(`pg_restore -d "${databaseUrl}" -1 -c --if-exists -O "${tmpFilePath}"`);
      }
      await fs.unlink(tmpFilePath).catch(() => {});
      return NextResponse.json({ success: true, message: "Database restored successfully." });
    } catch (execError: any) {
      await fs.unlink(tmpFilePath).catch(() => {});
      console.error("Restore execution error:", execError);
      return NextResponse.json({ error: execError.message || "Failed to execute restore." }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Restore failed:", error);
    return new NextResponse("Database restore failed: " + error.message, { status: 500 });
  }
}
