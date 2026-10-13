import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { calculateAge } from "@/lib/date-utils";
import { DiscountSlider } from "@/features/patients/components/discount-slider";
import { PaperImportForm } from "@/features/clinical/components/paper-import-form";
import { DoctorOrders } from "@/features/clinical/components/doctor-orders";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";
import { ClinicalDashboard } from "@/features/clinical/components/clinical-dashboard";
import { MedicalRecordItem } from "@/features/patients/components/medical-record-item";
import { PrescriptionHistoryItem } from "@/features/patients/components/prescription-history-item";
import { ScheduleAppointmentForm } from "@/features/visits/components/schedule-appointment-form";
import { StructuredLabResultView } from "@/features/clinical/components/structured-lab-result-view";
import { PendingApprovalBanner } from "@/features/patients/components/pending-approval-banner";

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
        include: { items: { include: { drug: true } } },
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
      { name: "Stool Examination", price: 5000, description: "Macroscopic, chemical occult & microscopic parasite examination" },
      { name: "Stool - Ova & Parasite (Microscopic)", price: 3000, description: "Direct wet mount and concentration for ova, cysts, and trophozoites" },
      { name: "Stool - Occult Blood (FOBT)", price: 2500, description: "Detection of hidden fecal blood / gastrointestinal bleeding" },
      { name: "Stool - Macroscopic & Physical", price: 2000, description: "Color, consistency, gross blood, pus, mucus & bile" },

      // Core Urine & Sub-tests
      { name: "Urine Examination", price: 5000, description: "Routine physical, chemical (dipstick) & microscopic sediment analysis" },
      { name: "Urine - Chemical Dipstick (Protein/Sugar/pH)", price: 3000, description: "Multistix chemical reagent strip test" },
      { name: "Urine - Microscopic Sediment Examination", price: 3000, description: "Centrifuged sediment analysis for WBC, RBC, casts, crystals, bacteria" },
      { name: "Urine - Albumin / Protein Test", price: 2000, description: "Qualitative and quantitative urinary protein/albumin" },
      { name: "Urine - Sugar / Glucose Test", price: 2000, description: "Qualitative and semi-quantitative urinary glucose" },
      { name: "Urine - Bile & Urobilinogen", price: 2000, description: "Bile pigments and urobilinogen screening" },

      // Core Hematology & Sub-tests
      { name: "Hematology", price: 10000, description: "Complete blood count (CBC), differential, indices, ESR & morphology" },
      { name: "Hematology - WBC & Differential", price: 4000, description: "Total White Blood Cell count and differential (%)" },
      { name: "Hematology - Hemoglobin & Hematocrit (Hgb/Hct)", price: 3500, description: "Hemoglobin and hematocrit concentration" },
      { name: "Hematology - Platelet Count", price: 3000, description: "Platelet evaluation and count" },
      { name: "Hematology - ESR", price: 2500, description: "Erythrocyte Sedimentation Rate" },
      { name: "Hematology - Coagulation Profile (PT/BT/CT)", price: 4000, description: "Bleeding time, coagulation time, prothrombin time" },
      { name: "Hematology - Blood Smear Morphology", price: 3500, description: "Peripheral blood smear examination and cellular morphology" },
    ];

    for (const core of defaultCoreTests) {
      const exists = await prisma.labTest.findFirst({
        where: { name: { equals: core.name, mode: "insensitive" } }
      });
      if (!exists) {
        await prisma.labTest.create({
          data: {
            name: core.name,
            price: core.price,
            description: core.description,
            isOperational: true,
          }
        });
      }
    }

    [labTests, drugs] = await Promise.all([
      prisma.labTest.findMany({ where: { isOperational: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.drug.findMany({
        where: { isOperational: true, batches: { some: { quantity: { gt: 0 } } } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
  }

  let referralDestinations: string[] = [];
  let clinicName = "";
  let clinicNameAmharic = "";
  let clinicLogo = "";

  if (canWriteHistory) {
    const [setting, nameSetting, amhSetting, logoSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "referral_destinations" } }),
      prisma.systemSetting.findUnique({ where: { key: "clinicName" } }),
      prisma.systemSetting.findUnique({ where: { key: "clinicNameAmharic" } }),
      prisma.systemSetting.findUnique({ where: { key: "clinicLogo" } })
    ]);
    
    if (setting) {
      try { referralDestinations = JSON.parse(setting.value); } catch(e) {}
    }
    if (nameSetting) clinicName = nameSetting.value;
    if (amhSetting) clinicNameAmharic = amhSetting.value;
    if (logoSetting) clinicLogo = logoSetting.value;
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

  const timeline = [
    ...patient.medicalRecords.map((r) => ({ type: "record" as const, date: r.originalDate || r.createdAt, data: r })),
    ...patient.prescriptions.map((p) => ({ type: "prescription" as const, date: p.createdAt, data: p }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const isNanSince = patient.patientType === "Civilian Staff" && (!patient.permanentSince || patient.permanentSince === "NaN");

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 print:p-0 print:max-w-none">
      <PrintHeader title="Patient Medical Record" subtitle={`Record for ${patient.firstName} ${patient.lastName}`} />

      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href="/patients" className="text-blue-600 hover:underline">
          &larr; Back to Patients
        </Link>
        {canReadHistory && <PrintButton label="Print Medical History" />}
      </div>

      {patient.status === "PENDING" && (
        <PendingApprovalBanner patientId={patient.id} canApprove={role === "Admin" || role === "Manager"} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:block print:space-y-6">
        {/* Patient Info Card */}
        <div className="col-span-1 md:col-span-2 space-y-6 print:w-full">
          <div
            className={`shadow-sm rounded-xl border p-6 ${isNanSince ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800/60" : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/60"}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Patient Profile
                {isNanSince && (
                  <span className="ml-2 text-xs text-red-600 dark:text-red-400 font-normal border border-red-300 dark:border-red-700 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50">
                    Missing &apos;Since&apos; Date
                  </span>
                )}
              </h2>
              {(role === "Admin" || role === "Manager" || (role === "Reception" && patient.patientType !== "Soldier" && (isNanSince || new Date().getTime() - patient.createdAt.getTime() < 86400000))) && (
                <Link
                  href={`/patients/${patient.id}/edit`}
                  className="text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-1 px-3 rounded border border-slate-300 dark:border-slate-700 transition-colors"
                >
                  Edit Details
                </Link>
              )}
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Full name</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                  {patient.salutation ? `${patient.salutation}. ` : ""}{patient.firstName} {patient.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Age</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{calculateAge(patient.yob)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Sex</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100 capitalize">{patient.gender || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Contact Number</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{patient.contactNumber || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">ID / Gov ID</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{patient.employeeId || patient.militaryId || "N/A"}</dd>
              </div>
              {patient.patientType === "Civilian Staff" && (
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Permanent Since</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{patient.permanentSince || "N/A"}</dd>
                </div>
              )}
              {patient.department && (
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Department / Division</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{patient.department}</dd>
                </div>
              )}
              {patient.c_m && (
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">C/M</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100 uppercase">{patient.c_m}</dd>
                </div>
              )}
            </dl>

            {/* Linked Primary Staff / Soldier Section */}
            {patient.primaryPatient && (
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 bg-blue-50/60 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-900/40">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                    Linked Primary Staff Member / Soldier
                  </h3>
                  <Link
                    href={`/patients/${patient.primaryPatient.id}`}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold underline"
                  >
                    View Primary Profile &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Name:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{patient.primaryPatient.firstName} {patient.primaryPatient.lastName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Card / Military / Employee ID:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">{patient.primaryPatient.militaryId || patient.primaryPatient.employeeId || "N/A"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Relationship & Type:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{patient.relationship || "Dependent"} • {patient.primaryPatient.patientType}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Family Tree / Dependents Section */}
          {patient.dependents && patient.dependents.length > 0 && (
            <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Family Tree & Dependents ({patient.dependents.length})
                  </h3>
                  <p className="text-xs text-slate-500">Registered family members linked to this staff record</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {patient.patientType === "Soldier" ? "100% Family Benefit" : "95% Family Benefit"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {patient.dependents.map((dep) => (
                  <div key={dep.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-between items-center hover:border-blue-400 transition-colors">
                    <div>
                      <Link href={`/patients/${dep.id}`} className="font-bold text-sm text-slate-800 dark:text-slate-200 hover:text-blue-600">
                        {dep.firstName} {dep.lastName}
                      </Link>
                      <div className="text-xs text-slate-500 mt-0.5 flex gap-2">
                        <span>Relation: <strong className="text-slate-700 dark:text-slate-300">{dep.relationship || "Dependent"}</strong></span>
                        <span>• Type: {dep.patientType}</span>
                        {dep.yob && <span>• Age: {calculateAge(dep.yob)}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block text-xs font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                        {dep.discountPercent}% Off
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="print:hidden space-y-6">
            {canWriteHistory && (
              <>
                <ClinicalDashboard patientId={patient.id} admissionStatus={patient.admissionStatus} activeVisit={patient.visits.find(v => v.status === "scheduled" || v.status === "in_progress")} />
                <PaperImportForm patientId={patient.id} />
              </>
            )}

            {(canPrescribe || canRequestLab || canWriteHistory) && <DoctorOrders patient={patient} labTests={labTests} drugs={drugs} referralDestinations={referralDestinations} clinicNames={{ clinicName, clinicNameAmharic, clinicLogo }} />}

            {canCreateVisit && <ScheduleAppointmentForm patientId={patient.id} doctors={doctorsList} />}
          </div>

{canReadHistory && (
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
)}
{canReadHistory && (
          <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Laboratory Results</h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {patient.labRequests.length} Test{patient.labRequests.length === 1 ? "" : "s"}
              </span>
            </div>

            {patient.labRequests.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">No lab requests found for this patient.</p>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {patient.labRequests.map((req) => (
                  <div key={req.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {req.test.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          • {req.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        {req.status === "completed" ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-bold text-green-800 dark:text-green-400">
                            Completed
                          </span>
                        ) : req.status === "cancelled" ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-400">
                            Cancelled
                          </span>
                        ) : req.status === "urgent" ? (
                          <span className="inline-flex items-center rounded-full bg-red-600 text-white px-2.5 py-0.5 text-xs font-extrabold shadow-sm animate-pulse">
                            ⚡ URGENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-400">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-1">
                      {req.result ? (
                        <StructuredLabResultView findings={req.result.findings} testName={req.test.name} />
                      ) : (
                        <div className="p-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 italic">
                          Awaiting laboratory analysis and technician input...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
)}
        </div>

        {/* Sidebar / Manager Actions */}
        <div className="col-span-1 space-y-6 print:hidden">
          {canUpdateDiscount ? (
            <DiscountSlider patientId={patient.id} initialDiscount={patient.discountPercent} />
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Current Discount</h3>
              <p className="mt-2 text-3xl font-extrabold text-blue-600">{patient.discountPercent}%</p>
              <p className="mt-1 text-xs text-slate-400">Read-only (Manager privileges required to update)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
