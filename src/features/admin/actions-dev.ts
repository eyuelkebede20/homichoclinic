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

export async function wipeAllMedicines() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) return { error: "Unauthorized" };

  const role = session.user.role || "User";
  if (role !== "Admin" && role !== "Manager" && role !== "Pharmacy") {
    return { error: "Access Denied: Only Admins, Managers or Pharmacy staff can wipe medicines." };
  }

  try {
    // Truncate Drug table. CASCADE will remove related items like batches and prescription items.
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Drug" CASCADE;`);
    
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "DEV_DATABASE_WIPE",
        resourceId: "ALL_MEDICINES",
        reason: "User executed a full wipe of the Drug and Medicine inventory catalog."
      }
    });

    revalidatePath("/pharmacy");
    revalidatePath("/pharmacy/catalog");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Medicine Wipe failed:", error);
    return { error: "Medicine wipe failed: " + error.message };
  }
}

export async function wipeAllLabTests() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) return { error: "Unauthorized" };

  const role = session.user.role || "User";
  if (role !== "Admin" && role !== "Manager" && role !== "Laboratory") {
    return { error: "Access Denied: Only Admins, Managers or Laboratory staff can wipe lab tests." };
  }

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "LabTest" CASCADE;`);
    
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "DEV_DATABASE_WIPE",
        resourceId: "ALL_LAB_TESTS",
        reason: "User executed a full wipe of LabTest catalog."
      }
    });

    revalidatePath("/laboratory");
    revalidatePath("/laboratory/catalog");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Lab test Wipe failed:", error);
    return { error: "Lab test wipe failed: " + error.message };
  }
}

export async function wipeAllDiseases() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) return { error: "Unauthorized" };

  const role = session.user.role || "User";
  if (role !== "Admin") {
    return { error: "Access Denied: Only Admins can wipe the disease catalog." };
  }

  try {
    await prisma.systemSetting.upsert({
      where: { key: "clinicDiseasesList" },
      update: { value: JSON.stringify([]) },
      create: { key: "clinicDiseasesList", value: JSON.stringify([]) },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "DEV_DATABASE_WIPE",
        resourceId: "ALL_DISEASES",
        reason: "Admin executed a DEV ONLY full wipe of the clinic disease catalog."
      }
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Disease Wipe failed:", error);
    return { error: "Disease wipe failed: " + error.message };
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
    
    // Also wipe clinic diseases catalog setting
    await prisma.systemSetting.upsert({
      where: { key: "clinicDiseasesList" },
      update: { value: JSON.stringify([]) },
      create: { key: "clinicDiseasesList", value: JSON.stringify([]) },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "DEV_DATABASE_WIPE",
        resourceId: "ALL_CATALOGS",
        reason: "Admin executed a DEV ONLY full wipe of Drug, LabTest, and Disease catalogs."
      }
    });

    revalidatePath("/pharmacy");
    revalidatePath("/lab");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Catalog Wipe failed:", error);
    return { error: "Database wipe failed: " + error.message };
  }
}
