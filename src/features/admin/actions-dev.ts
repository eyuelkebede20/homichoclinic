"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function wipeAllPatients() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) return { error: "Unauthorized" };

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  if (!userPermissions.includes(PERMISSIONS.USER_MANAGE) && role !== "Admin") {
    return { error: "Access Denied: Only Admins can wipe the database." };
  }

  try {
    // If using PostgreSQL, TRUNCATE cascades down to all related records automatically
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Patient" CASCADE;`);
    
    // We should also write a highly visible audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "DEV_DATABASE_WIPE",
        resourceId: "ALL_PATIENTS",
        reason: "Admin executed a DEV ONLY full wipe of the Patient table and all cascading relationships."
      }
    });

    revalidatePath("/patients");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Wipe failed:", error);
    return { error: "Database wipe failed: " + error.message };
  }
}

export async function wipeAllCatalogs() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) return { error: "Unauthorized" };

  const role = session.user.role || "User";
  if (role !== "Admin") {
    return { error: "Access Denied: Only Admins can wipe the catalogs." };
  }

  try {
    // Truncate Drug and LabTest tables. CASCADE will remove related items like batches and order items.
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Drug" CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "LabTest" CASCADE;`);
    
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "DEV_DATABASE_WIPE",
        resourceId: "ALL_CATALOGS",
        reason: "Admin executed a DEV ONLY full wipe of Drug and LabTest catalogs."
      }
    });

    revalidatePath("/pharmacy");
    revalidatePath("/lab");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Catalog Wipe failed:", error);
    return { error: "Database wipe failed: " + error.message };
  }
}
