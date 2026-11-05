import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { calculateAge, formatToEthiopianDate } from "@/lib/date-utils";
import { DiscountSlider } from "@/features/patients/components/discount-slider";
import { CompactPatientBanner } from "@/features/patients/components/compact-patient-banner";
import { DoctorConsultationWorkspace } from "@/features/clinical/components/doctor-consultation-workspace";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";
import { ClinicalDashboard } from "@/features/clinical/components/clinical-dashboard";
import { MedicalRecordItem } from "@/features/patients/components/medical-record-item";
import { PrescriptionHistoryItem } from "@/features/patients/components/prescription-history-item";
import { ScheduleAppointmentForm } from "@/features/visits/components/schedule-appointment-form";
import { StructuredLabResultView } from "@/features/clinical/components/structured-lab-result-view";
import { PatientLabResultsCard } from "@/features/clinical/components/patient-lab-results-card";
import { PendingApprovalBanner } from "@/features/patients/components/pending-approval-banner";
import { autoResetExpiredOpdVisits } from "@/features/clinical/actions";

export default async function PatientViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];

  if (!userPermissions.includes(PERMISSIONS.PATIENT_READ)) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to view patient records.</p>
      </div>
    );
  }

  // Auto-reset any expired OPD visits that reached 1 day (reset to null)
  await autoResetExpiredOpdVisits(resolvedParams.id);

  const patient = await prisma.patient.findUnique({
    where: { id: resolvedParams.id },
    include: {
      primaryPatient: true,
      dependents: {
        orderBy: { createdAt: "asc" },
      },
      medicalRecords: {
        orderBy: { createdAt: "desc" },
      },
      visits: {
        orderBy: { visitDate: "desc" },
      },
      labRequests: {
        include: { test: true, result: true },
        orderBy: { createdAt: "desc" },
      },
      prescriptions: {
        where: { deletedAt: null },
        include: {
          items: {
            where: { deletedAt: null },
            include: { drug: true }
          }
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!patient) {
    notFound();
  }

  const canUpdateDiscount = userPermissions.includes(PERMISSIONS.DISCOUNT_UPDATE);
  const canWriteHistory = userPermissions.includes(PERMISSIONS.HISTORY_WRITE);
  const canReadHistory = userPermissions.includes(PERMISSIONS.HISTORY_READ);
  const canPrescribe = userPermissions.includes(PERMISSIONS.PRESCRIPTION_CREATE);
  const canRequestLab = userPermissions.includes(PERMISSIONS.LAB_REQUEST);

  let labTests: { id: string; name: string }[] = [];
  let drugs: { id: string; name: string }[] = [];

  if (canPrescribe || canRequestLab) {
    // Ensure core diagnostic tests and individual hematology, stool, and urine sub-tests exist in catalog
    const defaultCoreTests = [
      // Core Stool & Sub-tests
      { name: "Stool Examination", price: 5000, description: "Complete stool examination (appearance, consistence, occult, parasites, etc.)" },
      { name: "Stool - Ova & Parasite (Microscopic)", price: 3000, description: "Direct wet mount and concentration for ova, cysts, and trophozoites" },
      { name: "Stool - Occult Blood (FOBT)", price: 2500, description: "Detection of hidden fecal blood / gastrointestinal bleeding" },
      { name: "Stool - Macroscopic & Physical", price: 2000, description: "Appearance, consistence, gross blood, pus, mucus & bile" },
      { name: "Stool - Appearance & Consistency", price: 1500, description: "Evaluation of stool appearance and consistency" },
      { name: "Stool - Gross Blood", price: 1500, description: "Visual inspection for macroscopic gross blood" },
      { name: "Stool - Pus & Mucus", price: 1500, description: "Screening for fecal pus cells and mucus" },
      { name: "Stool - Bile", price: 1500, description: "Stool bile assessment" },

      // Core Urine & Sub-tests
      { name: "Urine Examination", price: 5000, description: "Routine urinalysis (physical, chemical dipstick & microscopic sediment)" },
      { name: "Urine - Physical Examination (Quantity, Reaction, Specific Gravity)", price: 2000, description: "Quantity, pH reaction, and specific gravity" },
      { name: "Urine - Chemical Dipstick (Protein/Sugar/pH)", price: 3000, description: "Multistix chemical reagent strip test" },
      { name: "Urine - Microscopic Sediment Examination", price: 3000, description: "Centrifuged sediment analysis for WBC, RBC, casts, crystals, bacteria" },
      { name: "Urine - Albumin / Protein Test (Qualitative & Quantitative)", price: 2000, description: "Qualitative and quantitative urinary protein/albumin" },
      { name: "Urine - Sugar / Glucose Test (Qualitative & Quantitative)", price: 2000, description: "Qualitative and semi-quantitative urinary glucose" },
      { name: "Urine - Acetone & Diacetic Acid", price: 2000, description: "Screening for ketones: acetone and diacetic acid" },
      { name: "Urine - Bile & Urobilinogen (Bilirubin & Urobilin)", price: 2000, description: "Bile pigments, bilirubin, urobilinogen, and urobilin screening" },
      { name: "Urine - 17-Ketosteroids", price: 3000, description: "Urinary 17-ketosteroids assessment" },
      { name: "Urine - Electrolytes (Na & K)", price: 3000, description: "Urinary Sodium (Na) and Potassium (K) levels" },

      // Core Hematology & Sub-tests
      { name: "Hematology", price: 10000, description: "Complete blood count (CBC), differential, indices, ESR & morphology" },
      { name: "Hematology - WBC & Differential Count", price: 4000, description: "Total WBC and Differential (Neutrophils, Bands, Lymphocytes, Monocytes, Eosinophils, Basophils, Blast, Myelocytes)" },
      { name: "Hematology - Hemoglobin & Hematocrit (Hgb/Hct)", price: 3500, description: "Hemoglobin and hematocrit concentration" },
      { name: "Hematology - RBC Count", price: 3000, description: "Red blood cell count" },
      { name: "Hematology - Platelet Count", price: 3000, description: "Platelet evaluation and count" },
      { name: "Hematology - Reticulocyte Count", price: 3000, description: "Reticulocyte percentage and count" },
      { name: "Hematology - ESR (Sedimentation Rate)", price: 2500, description: "Erythrocyte Sedimentation Rate" },
      { name: "Hematology - Coagulation Profile (Bleeding, Clotting & Prothrombin Time)", price: 4500, description: "Bleeding time, coagulation time, prothrombin time" },
      { name: "Hematology - RBC Indices (MCV, MCH, MCHC)", price: 3000, description: "Mean Corpuscular Volume, MCH, and MCHC" },
      { name: "Hematology - Blood Smear Morphology", price: 3500, description: "Peripheral blood smear examination and cellular morphology" },
    ];

    // Fetch existing operational lab tests in a single efficient query
    const [existingLabTests, availableDrugs] = await Promise.all([
      prisma.labTest.findMany({
        where: { isOperational: { not: false }, deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.drug.findMany({
        where: { isOperational: true, batches: { some: { quantity: { gt: 0 } } } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    drugs = availableDrugs;

    // Check if any default core tests are missing
    const existingNames = new Set(existingLabTests.map((t) => t.name.toLowerCase().trim()));
    const missingTests = defaultCoreTests.filter((c) => !existingNames.has(c.name.toLowerCase().trim()));

    if (missingTests.length > 0) {
      // Seed missing tests in parallel without blocking with sequential queries
      await Promise.all(
        missingTests.map((core) =>
          prisma.labTest.create({
            data: {
              name: core.name,
              price: core.price,
              description: core.description,
              isOperational: true,
            },
          })
        )
      );
      labTests = await prisma.labTest.findMany({
        where: { isOperational: { not: false }, deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
    } else {
      labTests = existingLabTests;
    }
  }

  let referralDestinations: string[] = [];
  let clinicName = "Clinic";
  let clinicNameAmharic = "";
  let clinicLogo = "/icon.png";

  if (canWriteHistory || canPrescribe || canRequestLab) {
    const [setting, nameSetting, amhSetting, logoSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "referral_destinations" } }),
      prisma.systemSetting.findUnique({ where: { key: "clinicName" } }),
      prisma.systemSetting.findUnique({ where: { key: "clinicNameAmharic" } }),
      prisma.systemSetting.findUnique({ where: { key: "clinicLogo" } })
    ]);
    
    if (setting) {
      try { referralDestinations = JSON.parse(setting.value); } catch(e) {}
    }
    if (nameSetting?.value) clinicName = nameSetting.value;
    if (amhSetting?.value) clinicNameAmharic = amhSetting.value;
    if (logoSetting?.value) clinicLogo = logoSetting.value;
  }

  let doctorsList: { id: string; name: string }[] = [];
  const canCreateVisit = userPermissions.includes(PERMISSIONS.VISIT_CREATE);

  if (canCreateVisit) {
    doctorsList = await prisma.user.findMany({
      where: { role: "Doctor" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  const enteredByIds = Array.from(new Set(patient.medicalRecords.map((r) => r.enteredById).filter(Boolean)));
  const enteredUsers = enteredByIds.length > 0 
    ? await prisma.user.findMany({
        where: { id: { in: enteredByIds } },
        select: { id: true, name: true, role: true },
      })
    : [];
  const enteredUserMap = new Map(enteredUsers.map((u) => [u.id, u.name]));

  const timeline = [
    ...patient.medicalRecords.map((r) => ({
      type: "record" as const,
      date: r.originalDate || r.createdAt,
      data: {
        ...r,
        enteredByName: enteredUserMap.get(r.enteredById) || null,
      },
    })),
    ...patient.prescriptions.map((p) => ({ type: "prescription" as const, date: p.createdAt, data: p }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const isNanSince = patient.patientType === "Civilian Staff" && (!patient.permanentSince || patient.permanentSince === "NaN");
  const isDoctor = canWriteHistory || canPrescribe || canRequestLab;
  const activeVisit = patient.visits.find(v => 
    (v.status === "scheduled" || v.status === "in_progress") && 
    v.opdRoom !== null &&
    (Date.now() - new Date(v.visitDate).getTime() < 24 * 60 * 60 * 1000)
  );
  const canEditPatient = (role === "Admin" || role === "Manager" || (role === "Reception" && patient.patientType !== "Soldier" && (isNanSince || new Date().getTime() - patient.createdAt.getTime() < 86400000)));

  return (
    <div className={`mx-auto space-y-4 print:p-0 print:max-w-none ${isDoctor ? "max-w-[1600px] w-full p-3 sm:p-5 lg:p-6" : "max-w-6xl w-full p-4 sm:p-6 lg:p-8 space-y-6"}`}>
      <PrintHeader title="Patient Medical Record" subtitle={`Record for ${patient.firstName} ${patient.lastName}`} />

      {patient.status === "PENDING" && (
        <PendingApprovalBanner patientId={patient.id} canApprove={role === "Admin" || role === "Manager"} />
      )}

      {/* High-Density Minimal Patient Profile Banner (Takes only ~68px, expandable on demand) */}
      <CompactPatientBanner
        patient={patient}
        canEdit={canEditPatient}
        canUpdateDiscount={canUpdateDiscount}
        canReadHistory={canReadHistory}
        opdRoom={activeVisit?.opdRoom}
        printButtonSlot={canReadHistory ? <PrintButton label="Print Medical History" /> : undefined}
      />

      {isDoctor ? (
        /* Doctor Mode: Consultation Workspace takes 100% FULL GRID */
        <div className="w-full print:hidden">
          <DoctorConsultationWorkspace
            patient={patient}
            activeVisit={activeVisit}
            timeline={timeline}
            labTests={labTests}
            drugs={drugs}
            doctorsList={doctorsList}
            referralDestinations={referralDestinations}
            clinicNames={{ clinicName, clinicNameAmharic, clinicLogo }}
            admissionStatus={patient.admissionStatus}
            canWriteHistory={canWriteHistory}
            canPrescribe={canPrescribe}
            canRequestLab={canRequestLab}
            canCreateVisit={canCreateVisit}
          />
        </div>
      ) : (
        /* Non-Doctor Mode: Reception / Appointment scheduling */
        <div className="space-y-6 print:hidden">
          {canCreateVisit && <ScheduleAppointmentForm patientId={patient.id} doctors={doctorsList} />}
        </div>
      )}

      {/* Medical History section: Rendered on screen for non-doctors, and for printouts */}
      {canReadHistory && (
        <div className={`${isDoctor ? "hidden print:block" : "block"} space-y-6`}>
          <div id="medical-history" className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 p-6 scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Medical History</h2>
            <div className="space-y-4">
              {timeline.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No records found.</p>
              ) : (
                timeline.map((item) => 
                  item.type === "record" 
                    ? <MedicalRecordItem key={item.data.id} record={item.data as any} />
                    : <PrescriptionHistoryItem key={item.data.id} prescription={item.data as any} />
                )
              )}
            </div>
          </div>
          <PatientLabResultsCard labRequests={patient.labRequests} patientInfo={patient} />
        </div>
      )}
    </div>
  );
}
