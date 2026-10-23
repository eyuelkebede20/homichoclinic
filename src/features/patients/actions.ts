"use server";

import { createSafeAction } from "@/lib/safe-action";
import { z } from "zod";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { patientCreateSchema, patientUpdateSchema, discountUpdateSchema } from "./schemas";
import { revalidatePath } from "next/cache";
import { getYearsOfService, getStartOfDayLocal } from "@/lib/date-utils";

export const createPatient = createSafeAction({
  schema: patientCreateSchema,
  requiredPermission: PERMISSIONS.PATIENT_CREATE,
  handler: async (data, ctx) => {
    
    // Duplicate Detection Logic (Family members share phone numbers with staff)
    const isFamily = data.patientType === "Civilian Family" || data.patientType === "Soldier Family";
    if (data.contactNumber || (data.firstName && data.lastName && data.yob)) {
      const duplicateConditions = [];
      if (!isFamily && data.contactNumber && data.contactNumber.trim() !== "") {
        duplicateConditions.push({ contactNumber: data.contactNumber.trim() });
      }
      if (data.firstName && data.lastName && data.yob) {
        duplicateConditions.push({
          firstName: { equals: data.firstName.trim(), mode: "insensitive" as const },
          lastName: { equals: data.lastName.trim(), mode: "insensitive" as const },
          yob: data.yob
        });
      }
      
      if (duplicateConditions.length > 0) {
        const existing = await prisma.patient.findFirst({
          where: { OR: duplicateConditions }
        });
        if (existing) {
          throw new Error(`A patient with this Phone Number or exact Name+yob already exists (ID: ${existing.id}).`);
        }
      }
    }

    const yob = data.yob || null;
    
    let permanentSince = data.patientType === "Civilian Staff" ? data.permanentSince : null;
    let discountPercent = 0;
    let resolvedPrimaryId = data.primaryPatientId || null;
    let salutation: string | null = null;
    let department: string | null = null;
    let c_m: string | null = null;

    const discountSettings = await prisma.systemSetting.findMany({
      where: { key: { startsWith: "discount:" } }
    });
    const rules = discountSettings.reduce((acc, curr) => {
      acc[curr.key] = parseInt(curr.value, 10);
      return acc;
    }, {} as Record<string, number>);
    const getDiscount = (key: string, fallback: number) => (rules[key] !== undefined && !isNaN(rules[key]) ? rules[key] : fallback);

    if (data.patientType === "Soldier") {
      discountPercent = getDiscount("discount:Soldier", 100);
      salutation = data.rank || null;
      department = data.division || null;
      c_m = "M";
    } else if (data.patientType === "Civilian Family" || data.patientType === "Soldier Family") {
      if (data.primaryPatientId) {
        resolvedPrimaryId = data.primaryPatientId;
      } else if (data.staffSearchStr && !resolvedPrimaryId) {
        const terms = data.staffSearchStr.trim().split(/[\s,]+/).filter(Boolean);
        const searchConditions = terms.flatMap(term => [
          { contactNumber: { contains: term, mode: "insensitive" as const } },
          { militaryId: { contains: term, mode: "insensitive" as const } },
          { employeeId: { contains: term, mode: "insensitive" as const } },
          { id: { contains: term, mode: "insensitive" as const } },
          { firstName: { contains: term, mode: "insensitive" as const } },
          { lastName: { contains: term, mode: "insensitive" as const } }
        ]);
        const primary = await prisma.patient.findFirst({
          where: {
            AND: [
              { patientType: { in: ["Soldier", "Civilian Staff"] } },
              { OR: searchConditions }
            ]
          }
        });
        if (!primary) {
          throw new Error("Could not find a staff member with that Phone Number or ID. Please verify.");
        }
        resolvedPrimaryId = primary.id;
      }

      discountPercent = data.patientType === "Soldier Family" ? getDiscount("discount:Soldier Family", 100) : getDiscount("discount:Civilian Family", 5);
    } else if (data.patientType === "Guest") {
      discountPercent = getDiscount("discount:Guest", 0);
    } else {
      if (!permanentSince || permanentSince.trim() === "") {
        permanentSince = "NaN";
      }
      const yearsOfService = getYearsOfService(permanentSince);

      if (yearsOfService >= 20) discountPercent = getDiscount("discount:Civilian Staff:20", 100);
      else if (yearsOfService >= 15) discountPercent = getDiscount("discount:Civilian Staff:15", 75);
      else if (yearsOfService >= 10) discountPercent = getDiscount("discount:Civilian Staff:10", 65);
      else if (yearsOfService >= 6) discountPercent = getDiscount("discount:Civilian Staff:6", 55);
      else discountPercent = getDiscount("discount:Civilian Staff:0", 50);
    }

    const autoPilotSetting = await prisma.systemSetting.findUnique({
      where: { key: "registrationAutoPilot" }
    });
    const isAutoPilot = autoPilotSetting?.value === "true";

    let status = "APPROVED";
    // If reception creates a staff/soldier/family patient with paperwork, it goes to PENDING (unless auto pilot is on)
    if (
      !isAutoPilot &&
      ctx.role === "Reception" && 
      data.hasPaperwork && 
      ["Soldier", "Civilian Staff", "Civilian Family"].includes(data.patientType || "")
    ) {
      status = "PENDING";
    }

    const newPatient = await prisma.patient.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        yob: yob,
        gender: data.gender,
        contactNumber: data.contactNumber,
        patientType: data.patientType || "Civilian Staff",
        militaryId: data.militaryId,
        rank: data.rank,
        division: data.division,
        permanentSince: permanentSince,
        discountPercent: discountPercent,
        primaryPatientId: resolvedPrimaryId,
        relationship: data.relationship || null,
        salutation,
        department,
        c_m,
        status,
        hasPaperwork: data.hasPaperwork || false,
      },
    });

    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.PATIENT_CREATE,
      resourceId: newPatient.id,
      newValue: { id: newPatient.id, name: `${newPatient.firstName} ${newPatient.lastName}` },
    });

    revalidatePath("/patients");
    return newPatient;
  },
});

export const updatePatient = createSafeAction({
  schema: patientUpdateSchema,
  requiredPermission: PERMISSIONS.PATIENT_CREATE,
  handler: async (data, ctx) => {
    
    const existingPatient = await prisma.patient.findUnique({ where: { id: data.patientId } });
    if (!existingPatient) throw new Error("Patient not found.");

    if (ctx.role !== "Admin") {
      if (ctx.role === "Reception") {
        const isTimeExpired = new Date().getTime() - existingPatient.createdAt.getTime() >= 86400000;
        const isNanSince = !existingPatient.permanentSince || existingPatient.permanentSince === "NaN";
        if (isTimeExpired && !isNanSince) {
          throw new Error("Access Denied: Reception can only modify patient data within 24 hours of creation unless 'Since' is invalid.");
        }
      } else {
        throw new Error("Access Denied: You do not have permission to modify patient demographics.");
      }
    }

    const yob = data.yob || null;
    let permanentSince = existingPatient.patientType === "Civilian Staff" ? data.permanentSince : null;
    if (existingPatient.patientType === "Civilian Staff" && (!permanentSince || permanentSince.trim() === "")) {
      permanentSince = "NaN";
    }
    
    // Recalculate discount based on patient type and new hire date
    let discountPercent = existingPatient.discountPercent;
    let resolvedPrimaryId = existingPatient.primaryPatientId;
    let newRelationship = existingPatient.relationship;

    const discountSettings = await prisma.systemSetting.findMany({
      where: { key: { startsWith: "discount:" } }
    });
    const rules = discountSettings.reduce((acc, curr) => {
      acc[curr.key] = parseInt(curr.value, 10);
      return acc;
    }, {} as Record<string, number>);
    const getDiscount = (key: string, fallback: number) => (rules[key] !== undefined && !isNaN(rules[key]) ? rules[key] : fallback);

    if (existingPatient.patientType === "Soldier") {
      discountPercent = getDiscount("discount:Soldier", 100);
    } else if (existingPatient.patientType === "Civilian Family" || existingPatient.patientType === "Soldier Family") {
      if (data.primaryPatientId && data.primaryPatientId !== "" && data.primaryPatientId !== "UNLINK") {
        resolvedPrimaryId = data.primaryPatientId;
        newRelationship = data.relationship || existingPatient.relationship || "Other";
        discountPercent = existingPatient.patientType === "Soldier Family" ? getDiscount("discount:Soldier Family", 100) : getDiscount("discount:Civilian Family", 5);
      } else if (data.staffSearchStr != null) {
        const searchStr = data.staffSearchStr.trim();
        if (searchStr === "" || searchStr === "UNLINK") {
          resolvedPrimaryId = null;
          newRelationship = null;
          discountPercent = existingPatient.patientType === "Soldier Family" ? getDiscount("discount:Soldier Family", 100) : getDiscount("discount:Civilian Family", 5);
        } else {
          const terms = searchStr.split(/[\s,]+/).filter(Boolean);
          const searchConditions = terms.flatMap(term => [
            { contactNumber: { contains: term, mode: "insensitive" as const } },
            { militaryId: { contains: term, mode: "insensitive" as const } },
            { employeeId: { contains: term, mode: "insensitive" as const } },
            { id: { contains: term, mode: "insensitive" as const } },
            { firstName: { contains: term, mode: "insensitive" as const } },
            { lastName: { contains: term, mode: "insensitive" as const } }
          ]);
          const primary = await prisma.patient.findFirst({
            where: {
              AND: [
                { patientType: { in: ["Soldier", "Civilian Staff"] } },
                { OR: searchConditions }
              ]
            }
          });
          if (!primary) {
            throw new Error("Could not find a staff member with that Phone Number or ID. Please verify.");
          }
          resolvedPrimaryId = primary.id;
          newRelationship = data.relationship || "Other";
          discountPercent = existingPatient.patientType === "Soldier Family" ? getDiscount("discount:Soldier Family", 100) : getDiscount("discount:Civilian Family", 5);
        }
      } else {
        discountPercent = existingPatient.patientType === "Soldier Family" ? getDiscount("discount:Soldier Family", 100) : getDiscount("discount:Civilian Family", 5);
      }
    } else if (existingPatient.patientType === "Guest") {
      discountPercent = getDiscount("discount:Guest", 0);
    } else {
      const yearsOfService = getYearsOfService(permanentSince || "NaN");

      if (yearsOfService >= 20) discountPercent = getDiscount("discount:Civilian Staff:20", 100);
      else if (yearsOfService >= 15) discountPercent = getDiscount("discount:Civilian Staff:15", 75);
      else if (yearsOfService >= 10) discountPercent = getDiscount("discount:Civilian Staff:10", 65);
      else if (yearsOfService >= 6) discountPercent = getDiscount("discount:Civilian Staff:6", 55);
      else discountPercent = getDiscount("discount:Civilian Staff:0", 50);
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: data.patientId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        yob: yob,
        gender: data.gender,
        contactNumber: data.contactNumber,
        permanentSince: permanentSince,
        discountPercent: discountPercent,
        primaryPatientId: resolvedPrimaryId,
        relationship: newRelationship,
        ...(existingPatient.patientType === "Soldier" ? {
          militaryId: data.militaryId !== undefined ? data.militaryId : existingPatient.militaryId,
          rank: data.rank !== undefined ? data.rank : existingPatient.rank,
          division: data.division !== undefined ? data.division : existingPatient.division,
          salutation: data.rank !== undefined ? data.rank : existingPatient.salutation,
          department: data.division !== undefined ? data.division : existingPatient.department,
        } : {}),
      },
    });

    await logAudit({
      actorId: ctx.userId,
      action: "PATIENT_UPDATE",
      resourceId: updatedPatient.id,
      newValue: { id: updatedPatient.id, name: `${updatedPatient.firstName} ${updatedPatient.lastName}` },
    });

    revalidatePath(`/patients/${updatedPatient.id}`);
    revalidatePath("/patients");
    return updatedPatient;
  },
});

export const updateDiscount = createSafeAction({
  schema: discountUpdateSchema,
  requiredPermission: PERMISSIONS.DISCOUNT_UPDATE,
  handler: async (data, ctx) => {
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new Error("Patient not found");
    }

    if (patient.discountPercent === data.discountPercent) {
      return patient; // No change
    }

    const oldDiscount = patient.discountPercent;
    
    const updatedPatient = await prisma.patient.update({
      where: { id: data.patientId },
      data: { discountPercent: data.discountPercent },
    });

    // Write audit record for the discount change
    await logAudit({
      actorId: ctx.userId,
      action: PERMISSIONS.DISCOUNT_UPDATE,
      resourceId: patient.id,
      oldValue: { discountPercent: oldDiscount },
      newValue: { discountPercent: data.discountPercent },
      reason: data.reason || "Manager discount override",
    });

    revalidatePath(`/patients/${patient.id}`);
    return updatedPatient;
  },
});

export const searchPatientsFast = createSafeAction({
  schema: z.object({ 
    query: z.string().optional(),
    patientType: z.string().optional(),
    targetRole: z.string().optional(),
    filterField: z.enum(["all", "phone", "id", "name"]).optional(),
    excludePatientId: z.string().optional(),
  }),
  requiredPermission: PERMISSIONS.PATIENT_READ,
  handler: async (data, ctx) => {
    const term = (data.query || "").trim();
    
    const selectFields = {
      id: true,
      firstName: true,
      lastName: true,
      contactNumber: true,
      yob: true,
      gender: true,
      patientType: true,
      relationship: true,
      employeeId: true,
      militaryId: true,
      rank: true,
      division: true,
      department: true,
      salutation: true,
      permanentSince: true,
      primaryPatient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          contactNumber: true,
          employeeId: true,
          militaryId: true,
          patientType: true,
          rank: true,
          division: true,
          department: true,
        }
      },
      dependents: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          patientType: true,
          relationship: true,
          contactNumber: true,
        }
      },
      visits: {
        where: {
          visitDate: { gte: getStartOfDayLocal(), gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          status: { in: ["scheduled", "in_progress"] },
          opdRoom: { not: null },
          deletedAt: null
        },
        take: 1,
        select: {
          id: true,
          opdRoom: true,
          status: true,
        }
      }
    };

    const roleTarget = data.targetRole || data.patientType;
    let roleCondition: any = undefined;
    if (roleTarget && roleTarget !== "All") {
      if (roleTarget === "Soldier") {
        roleCondition = { patientType: { in: ["Soldier", "M"] } };
      } else if (roleTarget === "Civilian Staff") {
        roleCondition = { patientType: { in: ["Civilian Staff", "P"] } };
      } else if (roleTarget === "Soldier Family") {
        roleCondition = { patientType: "Soldier Family" };
      } else if (roleTarget === "Civilian Family") {
        roleCondition = { patientType: "Civilian Family" };
      } else if (roleTarget === "Family") {
        roleCondition = { patientType: { in: ["Soldier Family", "Civilian Family"] } };
      } else if (roleTarget === "StaffOnly") {
        roleCondition = { patientType: { in: ["Soldier", "Civilian Staff", "M", "P"] } };
      } else {
        roleCondition = { patientType: roleTarget };
      }
    }

    const excludeCondition = data.excludePatientId ? { id: { not: data.excludePatientId } } : undefined;

    if (!term) {
      const baseConditions = [roleCondition, excludeCondition].filter(Boolean);
      return await prisma.patient.findMany({
        where: baseConditions.length > 0 ? { AND: baseConditions } : undefined,
        orderBy: { createdAt: "desc" },
        take: 12,
        select: selectFields
      });
    }

    const tokens = term.split(/[\s,]+/).filter(Boolean);
    const filterField = data.filterField || "all";

    const tokenConditions = tokens.map(t => {
      const isDigitsOnly = /^\d+$/.test(t);
      const phoneVariants = [t];
      if (isDigitsOnly) {
        if (t.startsWith("0")) {
          phoneVariants.push(t.slice(1));
          phoneVariants.push(`+251${t.slice(1)}`);
        } else if (t.startsWith("251")) {
          phoneVariants.push(`+${t}`);
          phoneVariants.push(`0${t.slice(3)}`);
        } else {
          phoneVariants.push(`0${t}`);
          phoneVariants.push(`+251${t}`);
        }
      }

      const phoneConditions = phoneVariants.flatMap(v => [
        { contactNumber: { contains: v, mode: "insensitive" as const } },
        { primaryPatient: { contactNumber: { contains: v, mode: "insensitive" as const } } }
      ]);

      if (filterField === "phone") {
        return {
          OR: phoneConditions
        };
      }
      if (filterField === "id") {
        return {
          OR: [
            { employeeId: { contains: t, mode: "insensitive" as const } },
            { militaryId: { contains: t, mode: "insensitive" as const } },
            { id: { contains: t, mode: "insensitive" as const } },
            {
              primaryPatient: {
                OR: [
                  { employeeId: { contains: t, mode: "insensitive" as const } },
                  { militaryId: { contains: t, mode: "insensitive" as const } },
                ]
              }
            }
          ]
        };
      }
      if (filterField === "name") {
        return {
          OR: [
            { firstName: { contains: t, mode: "insensitive" as const } },
            { lastName: { contains: t, mode: "insensitive" as const } },
            {
              primaryPatient: {
                OR: [
                  { firstName: { contains: t, mode: "insensitive" as const } },
                  { lastName: { contains: t, mode: "insensitive" as const } },
                ]
              }
            }
          ]
        };
      }

      // 'all'
      return {
        OR: [
          { firstName: { contains: t, mode: "insensitive" as const } },
          { lastName: { contains: t, mode: "insensitive" as const } },
          ...phoneConditions,
          { employeeId: { contains: t, mode: "insensitive" as const } },
          { militaryId: { contains: t, mode: "insensitive" as const } },
          { yob: { contains: t, mode: "insensitive" as const } },
          { id: { contains: t, mode: "insensitive" as const } },
          {
            primaryPatient: {
              OR: [
                { firstName: { contains: t, mode: "insensitive" as const } },
                { lastName: { contains: t, mode: "insensitive" as const } },
                { employeeId: { contains: t, mode: "insensitive" as const } },
                { militaryId: { contains: t, mode: "insensitive" as const } },
              ]
            }
          }
        ]
      };
    });

    const andConditions = [
      ...tokenConditions,
      roleCondition,
      excludeCondition
    ].filter(Boolean);

    return await prisma.patient.findMany({
      where: {
        AND: andConditions
      },
      take: 15,
      select: selectFields
    });
  }
});

export const approvePatient = createSafeAction({
  schema: z.object({ patientId: z.string() }),
  requiredPermission: PERMISSIONS.PATIENT_CREATE, 
  handler: async (data, ctx) => {
    if (ctx.role !== "Admin" && ctx.role !== "Manager") {
      throw new Error("Only Managers and Admins can approve patient registrations.");
    }

    const patient = await prisma.patient.update({
      where: { id: data.patientId },
      data: { status: "APPROVED" }
    });

    await logAudit({
      actorId: ctx.userId,
      action: "PATIENT_APPROVE",
      resourceId: patient.id,
      newValue: { status: "APPROVED" }
    });

    revalidatePath("/patients");
    revalidatePath(`/patients/${patient.id}`);
    
    return patient;
  }
});
