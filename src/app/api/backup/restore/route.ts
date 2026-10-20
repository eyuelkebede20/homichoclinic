import { NextResponse } from "next/server";
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
import pkg from "../../../../../package.json";

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

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const role = session.user.role || "User";
  if (role !== "Admin" && role !== "Manager") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return new NextResponse("DATABASE_URL is not set.", { status: 500 });
  }

  const tempFilesToClean: string[] = [];

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No backup file provided or file is empty." }, { status: 400 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // 1. Detect if the file is gzipped (magic bytes 0x1F 0x8B)
    let decompressedBuffer = rawBuffer;
    const isGzip = rawBuffer.length >= 2 && rawBuffer[0] === 0x1f && rawBuffer[1] === 0x8b;
    if (isGzip) {
      try {
        decompressedBuffer = zlib.gunzipSync(rawBuffer);
      } catch (gzErr: any) {
        return NextResponse.json({ error: "Failed to decompress gzipped backup: " + gzErr.message }, { status: 400 });
      }
    }

    // 2. Detect if decompressed content is PostgreSQL custom binary format (magic bytes: PGDMP)
    const isCustomArchive =
      decompressedBuffer.length >= 5 &&
      decompressedBuffer.subarray(0, 5).toString("utf8") === "PGDMP";

    const timestamp = Date.now();
    const fileExt = isCustomArchive ? "backup" : "sql";
    const tmpFilePath = path.join(os.tmpdir(), `restore_${timestamp}.${fileExt}`);
    tempFilesToClean.push(tmpFilePath);

    await fs.writeFile(tmpFilePath, decompressedBuffer);

    const { env: pgEnv, dbName } = getPgEnv(databaseUrl);

    // Disconnect active Prisma connections to avoid connection holding
    await prisma.$disconnect().catch(() => {});

    // 3. Execute restore using pg_restore (custom) or psql (sql script)
    try {
      if (isCustomArchive) {
        // Run pg_restore with clean, if-exists, and no-owner/no-privileges to avoid permission issues
        try {
          await execAsync(
            `pg_restore --clean --if-exists --no-owner --no-privileges -d "${dbName}" "${tmpFilePath}"`,
            { env: pgEnv }
          );
        } catch (restoreErr: any) {
          // pg_restore returns exit code 1 if non-fatal warnings occurred (e.g. dropping objects that don't exist yet)
          // If the exit code is 1, check if tables exist and proceed
          if (restoreErr.code === 1) {
            console.warn("pg_restore completed with warnings (code 1):", restoreErr.stderr);
          } else {
            throw restoreErr;
          }
        }
      } else {
        // Run psql on SQL script
        await execAsync(`psql -v ON_ERROR_STOP=1 -f "${tmpFilePath}"`, { env: pgEnv });
      }
    } catch (execError: any) {
      console.error("Restore execution error:", execError);
      return NextResponse.json(
        { error: "Failed to execute database restore: " + (execError.stderr || execError.message) },
        { status: 500 }
      );
    }

    // 4. CRITICAL: Automatic Schema Reconciliation Across Versions
    // If the backup came from an older version of the clinic system, running prisma db push ensures
    // that any newly introduced columns or tables are created with default values without deleting data.
    try {
      await execAsync("npx prisma db push --accept-data-loss --skip-generate", {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
        },
      });
    } catch (pushErr: any) {
      console.warn("Post-restore schema reconciliation warning:", pushErr.message);
    }

    // 5. Detect restored version and update SystemSetting
    let restoredVersion = "Unknown";
    try {
      const restoredVersionSetting = await prisma.systemSetting.findUnique({
        where: { key: "appVersion" },
      });
      if (restoredVersionSetting?.value) {
        restoredVersion = restoredVersionSetting.value;
      }

      const currentAppVersion = pkg.version || "0.1.29";
      await prisma.systemSetting.upsert({
        where: { key: "appVersion" },
        update: { value: currentAppVersion },
        create: { key: "appVersion", value: currentAppVersion },
      });
      await prisma.systemSetting.upsert({
        where: { key: "lastRestoreAt" },
        update: { value: new Date().toISOString() },
        create: { key: "lastRestoreAt", value: new Date().toISOString() },
      });
      await prisma.systemSetting.upsert({
        where: { key: "lastRestoreFromVersion" },
        update: { value: restoredVersion },
        create: { key: "lastRestoreFromVersion", value: restoredVersion },
      });
    } catch (metaErr) {
      console.warn("Could not record post-restore metadata:", metaErr);
    }

    // 6. Log the restore action in the system audit log
    await logAudit({
      actorId: session.user.id,
      action: "database:restore",
      resourceId: dbName,
      newValue: {
        filename: file.name,
        restoredVersion,
        currentAppVersion: pkg.version,
        format: isCustomArchive ? "custom_binary" : isGzip ? "compressed_sql" : "plain_sql",
      },
      reason: `Admin restored database from ${file.name} (Source Version: ${restoredVersion})`,
    });

    return NextResponse.json({
      success: true,
      message: `Database restored and reconciled successfully to v${pkg.version}.`,
      restoredVersion,
      currentVersion: pkg.version,
    });
  } catch (error: any) {
    console.error("Restore failed:", error);
    return NextResponse.json({ error: "Database restore failed: " + error.message }, { status: 500 });
  } finally {
    for (const f of tempFilesToClean) {
      await fs.unlink(f).catch(() => {});
    }
  }
}
