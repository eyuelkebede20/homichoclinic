import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPermissions, PERMISSIONS } from "@/lib/permissions";
import { formatToEthiopianDate, getStartOfDayLocal } from "@/lib/date-utils";
import { AdmittedPatientsReport, DossierPatient } from "@/features/admin/components/admitted-patients-report";

export const metadata = {
  title: "Admitted Patients 3-Month Report | Clinic ERP",
};

export default async function AdmittedReportPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role || "User";
  const userPermissions = getUserPermissions(role);

  // Managers and Admins or users with PATIENT_READ or USER_MANAGE can access
  const hasAccess =
    role === "Admin" ||
    role === "Manager" ||
    userPermissions.includes(PERMISSIONS.PATIENT_READ) ||
    userPermissions.includes(PERMISSIONS.USER_MANAGE);

  if (!hasAccess) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Access Denied</h2>
        <p className="text-slate-600 dark:text-slate-400">
          You do not have permission to access the Inpatient Admitted Patients Report.
        </p>
      </div>
    );
  }

  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const [
    clinicNameSetting,
    clinicNameAmharicSetting,
    clinicLogoSetting,
    users,
    patientsRaw,
  ] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "clinicName" } }),
    prisma.systemSetting.findUnique({ where: { key: "clinicNameAmharic" } }),
    prisma.systemSetting.findUnique({ where: { key: "clinicLogo" } }),
    prisma.user.findMany({ select: { id: true, name: true, role: true } }),
    // Fetch patients who are Inpatients OR have activity in the last 6 months
    prisma.patient.findMany({
      where: {
        deletedAt: null,
        OR: [
          { admissionStatus: "Inpatient" },
          { visits: { some: { visitDate: { gte: sixMonthsAgo } } } },
          { medicalRecords: { some: { createdAt: { gte: sixMonthsAgo } } } },
          { labRequests: { some: { createdAt: { gte: sixMonthsAgo } } } },
          { prescriptions: { some: { createdAt: { gte: sixMonthsAgo } } } },
        ],
      },
      include: {
        primaryPatient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            militaryId: true,
            employeeId: true,
            patientType: true,
          },
        },
        visits: {
          where: { deletedAt: null },
          orderBy: { visitDate: "desc" },
        },
        medicalRecords: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
        labRequests: {
          where: { deletedAt: null },
          include: { test: true, result: true },
          orderBy: { createdAt: "desc" },
        },
        prescriptions: {
          where: { deletedAt: null },
          include: { items: { include: { drug: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
  ]);

  const userNameMap = new Map(users.map((u) => [u.id, u.name]));
  const clinicName = clinicNameSetting?.value || "Homicho Clinic";
  const clinicNameAmharic = clinicNameAmharicSetting?.value || "የሆሚቾ አሙኒሽን ኢንጂነሪንግ ኢንዱስትሪ ክሊኒክ";
  let clinicLogo = clinicLogoSetting?.value || null;

  try {
    const fs = await import("fs");
    const path = await import("path");
    const iconFile = path.join(process.cwd(), "public", "icon.png");
    if (fs.existsSync(iconFile)) {
      clinicLogo = "/icon.png";
    }
  } catch (e) {
    // ignore
  }

  // Transform patient data into DossierPatient objects
  const patients: DossierPatient[] = patientsRaw.map((p) => {
    const visits = p.visits.map((v) => ({
      id: v.id,
      visitDate: formatToEthiopianDate(v.visitDate),
      rawDate: v.visitDate.toISOString(),
      status: v.status,
      opdRoom: v.opdRoom,
      doctorName: v.doctorId ? userNameMap.get(v.doctorId) || null : null,
      notes: v.notes,
      vitals: (v.vitals as any) || null,
    }));

    const medicalRecords = p.medicalRecords.map((mr) => ({
      id: mr.id,
      date: formatToEthiopianDate(mr.originalDate || mr.createdAt),
      rawDate: (mr.originalDate || mr.createdAt).toISOString(),
      source: mr.source,
      content: mr.content,
      enteredByName: mr.enteredById ? userNameMap.get(mr.enteredById) || null : null,
      bp: mr.bp,
      heartRate: mr.heartRate,
      temp: mr.temp,
      weight: mr.weight,
      subjective: mr.subjective,
      objective: mr.objective,
      assessment: mr.assessment,
      plan: mr.plan,
    }));

    const labRequests = p.labRequests.map((l) => ({
      id: l.id,
      date: formatToEthiopianDate(l.createdAt),
      rawDate: l.createdAt.toISOString(),
      testName: l.test?.name || "Diagnostic Test",
      testCategory: l.test?.description || null,
      status: l.status,
      requestedByName: l.requestedBy ? userNameMap.get(l.requestedBy) || null : null,
      notes: l.notes,
      result: l.result
        ? {
            id: l.result.id,
            findings: l.result.findings,
            date: formatToEthiopianDate(l.result.createdAt),
            enteredByName: l.result.enteredBy ? userNameMap.get(l.result.enteredBy) || null : null,
            isReadByDoctor: l.result.isReadByDoctor,
          }
        : null,
    }));

    const prescriptions = p.prescriptions.map((rx) => ({
      id: rx.id,
      date: formatToEthiopianDate(rx.createdAt),
      rawDate: rx.createdAt.toISOString(),
      status: rx.status,
      doctorName: rx.doctorId ? userNameMap.get(rx.doctorId) || null : null,
      items: rx.items.map((item) => ({
        id: item.id,
        drugName: item.drug?.name || "Prescribed Drug",
        unit: item.drug?.unit || "Unit",
        quantity: item.quantity,
        instructions: item.instructions,
      })),
    }));

    // Find latest vitals across medical records and visits
    let latestVitals: DossierPatient["latestVitals"] = null;
    for (const mr of p.medicalRecords) {
      if (mr.bp || mr.heartRate || mr.temp || mr.weight) {
        latestVitals = {
          bp: mr.bp || undefined,
          heartRate: mr.heartRate || undefined,
          temp: mr.temp || undefined,
          weight: mr.weight || undefined,
        };
        break;
      }
    }
    if (!latestVitals) {
      for (const v of p.visits) {
        const vVitals = v.vitals as any;
        if (vVitals && (vVitals.bp || vVitals.heartRate || vVitals.temp || vVitals.weight)) {
          latestVitals = {
            bp: vVitals.bp,
            heartRate: vVitals.heartRate,
            temp: vVitals.temp,
            weight: vVitals.weight,
          };
          break;
        }
      }
    }

    // Collect all unique attending doctors
    const docNames = new Set<string>();
    p.visits.forEach((v) => {
      if (v.doctorId) {
        const name = userNameMap.get(v.doctorId);
        if (name) docNames.add(`Dr. ${name}`);
      }
    });
    p.medicalRecords.forEach((mr) => {
      if (mr.enteredById) {
        const name = userNameMap.get(mr.enteredById);
        if (name) docNames.add(`Dr. ${name}`);
      }
    });
    p.prescriptions.forEach((rx) => {
      if (rx.doctorId) {
        const name = userNameMap.get(rx.doctorId);
        if (name) docNames.add(`Dr. ${name}`);
      }
    });

    // Primary assessments
    const assessments: string[] = [];
    p.medicalRecords.forEach((mr) => {
      if (mr.assessment && mr.assessment.trim()) {
        assessments.push(mr.assessment.trim());
      }
    });

    return {
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      salutation: p.salutation,
      yob: p.yob,
      gender: p.gender,
      contactNumber: p.contactNumber,
      patientType: p.patientType || "Civilian Staff",
      militaryId: p.militaryId,
      rank: p.rank,
      division: p.division,
      employeeId: p.employeeId,
      department: p.department,
      permanentSince: p.permanentSince,
      c_m: p.c_m,
      emergencyContact: p.emergencyContact,
      emergencyMobile: p.emergencyMobile,
      discountPercent: p.discountPercent || 0,
      admissionStatus: p.admissionStatus || "Outpatient",
      relationship: p.relationship,
      primaryPatient: p.primaryPatient,
      visits,
      medicalRecords,
      labRequests,
      prescriptions,
      latestVitals,
      attendingDoctors: Array.from(docNames),
      primaryAssessments: assessments,
      lastEncounterDate: visits[0]?.visitDate || medicalRecords[0]?.date,
    };
  });

  const currentEthiopianDateStr = formatToEthiopianDate(now);
  const threeMonthsAgoEthiopianDateStr = formatToEthiopianDate(threeMonthsAgo);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto print:p-0 print:max-w-none">
      <AdmittedPatientsReport
        patients={patients}
        clinicInfo={{
          name: clinicName,
          nameAmharic: clinicNameAmharic,
          logo: clinicLogo,
          userName: session.user.name,
          userRole: role,
        }}
        defaultPeriodDays={90}
        currentEthiopianDateStr={currentEthiopianDateStr}
        threeMonthsAgoEthiopianDateStr={threeMonthsAgoEthiopianDateStr}
      />
    </div>
  );
}
