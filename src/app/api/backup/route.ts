import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ROLE_PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { exec } from "child_process";
import util from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import zlib from "zlib";
import pkg from "../../../../package.json";

const execAsync = util.promisify(exec);

function getPgEnv(databaseUrl: string) {
  const urlParts = databaseUrl.split("?");
  const cleanUrl = urlParts[0];
  const parsed = new URL(cleanUrl);

  return {
    env: {
      ...process.env,
      PGHOST: parsed.hostname,
      PGPORT: parsed.port || "5432",
      PGUSER: decodeURIComponent(parsed.username),
      PGPASSWORD: decodeURIComponent(parsed.password),
      PGDATABASE: parsed.pathname.replace(/^\//, ""),
    },
    dbName: parsed.pathname.replace(/^\//, ""),
  };
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];

  // Ensure only Admin or Manager can backup
  if (role !== "Admin" && role !== "Manager") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return new NextResponse("DATABASE_URL is not set.", { status: 500 });
  }

  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") || "sql.gz"; // Default: compressed SQL (cross-version compatible)

  const appVersion = pkg.version || "0.1.29";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  // Step 1: Stamp version metadata into the database so the dump contains this version
  try {
    await prisma.systemSetting.upsert({
      where: { key: "appVersion" },
      update: { value: appVersion },
      create: { key: "appVersion", value: appVersion },
    });
    await prisma.systemSetting.upsert({
      where: { key: "lastBackupAt" },
      update: { value: new Date().toISOString() },
      create: { key: "lastBackupAt", value: new Date().toISOString() },
    });
  } catch (metaErr) {
    console.warn("Could not pre-stamp backup metadata in SystemSetting:", metaErr);
  }

  const { env: pgEnv, dbName } = getPgEnv(databaseUrl);
  const tempFilesToClean: string[] = [];

  try {
    let fileName: string;
    let fileBuffer: Buffer;
    let contentType: string;

    if (format === "backup") {
      // PostgreSQL Custom Binary Format (-F c)
      fileName = `homichoclinic_backup_v${appVersion}_${timestamp}.backup`;
      const tmpFilePath = path.join(os.tmpdir(), fileName);
      tempFilesToClean.push(tmpFilePath);

      await execAsync(`pg_dump -F c -f "${tmpFilePath}"`, { env: pgEnv });
      fileBuffer = await fs.readFile(tmpFilePath);
      contentType = "application/octet-stream";
    } else if (format === "sql") {
      // Plain uncompressed SQL
      fileName = `homichoclinic_backup_v${appVersion}_${timestamp}.sql`;
      const tmpFilePath = path.join(os.tmpdir(), fileName);
      tempFilesToClean.push(tmpFilePath);

      await execAsync(`pg_dump --clean --if-exists -f "${tmpFilePath}"`, { env: pgEnv });
      fileBuffer = await fs.readFile(tmpFilePath);
      contentType = "text/plain";
    } else {
      // Default: Compressed SQL (.sql.gz) - universally portable across PostgreSQL versions
      fileName = `homichoclinic_backup_v${appVersion}_${timestamp}.sql.gz`;
      const rawSqlPath = path.join(os.tmpdir(), `homichoclinic_backup_v${appVersion}_${timestamp}.raw.sql`);
      const gzPath = path.join(os.tmpdir(), fileName);
      tempFilesToClean.push(rawSqlPath, gzPath);

      // Dump SQL with DROP IF EXISTS clauses so it restores cleanly over existing schemas
      await execAsync(`pg_dump --clean --if-exists -f "${rawSqlPath}"`, { env: pgEnv });
      const rawContent = await fs.readFile(rawSqlPath);
      const compressed = zlib.gzipSync(rawContent);
      await fs.writeFile(gzPath, compressed);

      fileBuffer = compressed;
      contentType = "application/gzip";
    }

    // Log the backup action in system audit
    await logAudit({
      actorId: session.user.id,
      action: "database:backup",
      resourceId: dbName,
      newValue: { format, fileName, appVersion, size: fileBuffer.length },
      reason: `Admin downloaded database backup (${format}, v${appVersion})`,
    });

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-App-Version": appVersion,
      },
    });
  } catch (error: any) {
    console.error("Backup failed:", error);
    return new NextResponse("Database backup failed: " + error.message, { status: 500 });
  } finally {
    for (const f of tempFilesToClean) {
      await fs.unlink(f).catch(() => {});
    }
  }
}
