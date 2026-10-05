import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { calculateECAge } from "@/lib/ethiopian-calendar";
import { DiscountSlider } from "@/features/patients/components/discount-slider";
import { PaperImportForm } from "@/features/clinical/components/paper-import-form";
import { DoctorOrders } from "@/features/clinical/components/doctor-orders";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";
import { ClinicalDashboard } from "@/features/clinical/components/clinical-dashboard";
import { MedicalRecordItem } from "@/features/patients/components/medical-record-item";
import { ScheduleAppointmentForm } from "@/features/visits/components/schedule-appointment-form";

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
  const canPrescribe = userPermissions.includes(PERMISSIONS.PRESCRIPTION_CREATE);
  const canRequestLab = userPermissions.includes(PERMISSIONS.LAB_REQUEST);

  let labTests: { id: string; name: string }[] = [];
  let drugs: { id: string; name: string }[] = [];

  if (canPrescribe || canRequestLab) {
    [labTests, drugs] = await Promise.all([
      prisma.labTest.findMany({ where: { isOperational: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.drug.findMany({
        where: { isOperational: true, batches: { some: { quantity: { gt: 0 } } } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
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

  const isNanSince = !patient.permanentSince || patient.permanentSince === "NaN";

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 print:p-0 print:max-w-none">
      <PrintHeader title="Patient Medical Record" subtitle={`Record for ${patient.firstName} ${patient.lastName}`} />

      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href="/patients" className="text-blue-600 hover:underline">
          &larr; Back to Patients
        </Link>
        <PrintButton label="Print Medical History" />
      </div>

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
              {(role === "Admin" || (role === "Receptionist" && patient.patientType !== "Soldier" && (isNanSince || new Date().getTime() - patient.createdAt.getTime() < 86400000))) && (
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
                  {patient.firstName} {patient.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Age</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{calculateECAge(patient.yob)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Gender</dt>
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
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Permanent Since</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{patient.permanentSince || "N/A"}</dd>
              </div>
            </dl>
          </div>

          <div className="print:hidden space-y-6">
            {canWriteHistory && (
              <>
                <ClinicalDashboard patientId={patient.id} admissionStatus={patient.admissionStatus} activeVisit={patient.visits.find(v => v.status === "scheduled" || v.status === "in_progress")} />
                <PaperImportForm patientId={patient.id} />
              </>
            )}

            {(canPrescribe || canRequestLab) && <DoctorOrders patientId={patient.id} labTests={labTests} drugs={drugs} />}

            {canCreateVisit && <ScheduleAppointmentForm patientId={patient.id} doctors={doctorsList} />}
          </div>

          <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Medical History</h2>
            <div className="space-y-4">
              {patient.medicalRecords.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No records found.</p>
              ) : (
                patient.medicalRecords.map((record) => <MedicalRecordItem key={record.id} record={record} />)
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Laboratory Results</h2>
            <div className="space-y-4">
              {patient.labRequests.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No lab requests found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/50">
                    <thead className="bg-slate-50/50 dark:bg-slate-900/30">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Test</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Result / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="bg-transparent divide-y divide-slate-100 dark:divide-slate-800/50">
                      {patient.labRequests.map((req) => (
                        <tr key={req.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{req.createdAt.toLocaleDateString()}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{req.test.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {req.status === "completed" ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-400">
                                Completed
                              </span>
                            ) : req.status === "cancelled" ? (
                              <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-400">Cancelled</span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-400">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-w-xs">
                            {req.result ? <div>{req.result.findings}</div> : <span className="text-slate-400 italic">Awaiting lab</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
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
