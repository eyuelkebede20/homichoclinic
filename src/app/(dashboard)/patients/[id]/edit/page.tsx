import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { ROLE_PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PatientEditForm } from "@/features/patients/components/patient-edit-form";

export default async function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role || "User";
  
  
  if (role !== "Admin") {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to edit patient records.</p>
      </div>
    );
  }

  const patient = await prisma.patient.findUnique({
    where: { id: resolvedParams.id }
  });

  if (!patient) {
    notFound();
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <PatientEditForm patient={patient} />
    </div>
  );
}
