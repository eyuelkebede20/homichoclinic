import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getTopDiagnosedDiseases,
  getTopDiseasesMedicineProtocols,
} from "@/features/clinical/actions";
import { DoctorMorbidityDashboard } from "@/features/clinical/components/doctor-morbidity-dashboard";

export default async function MorbidityPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?reset=1");
  }

  const role = session.user.role || "User";
  const allowedRoles = ["Doctor", "Admin", "Manager", "Nurse", "Pharmacy", "Laboratory"];
  if (!allowedRoles.includes(role)) {
    redirect("/dashboard");
  }

  const [clinicNameSetting, clinicNameAmharicSetting, initialDiseases, initialProtocols] =
    await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "clinicName" } }),
      prisma.systemSetting.findUnique({ where: { key: "clinicNameAmharic" } }),
      getTopDiagnosedDiseases(20, "week"),
      getTopDiseasesMedicineProtocols(10, "week"),
    ]);

  const clinicName = clinicNameSetting?.value || "Clinic ERP";
  const clinicNameAmharic = clinicNameAmharicSetting?.value || "";

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <DoctorMorbidityDashboard
        initialDiseases={initialDiseases}
        initialProtocols={initialProtocols}
        clinicInfo={{
          name: clinicName,
          nameAmharic: clinicNameAmharic,
          userName: session.user.name,
          userRole: role,
        }}
      />
    </div>
  );
}
