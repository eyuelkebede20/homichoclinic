import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPermissions, PERMISSIONS } from "@/lib/permissions";
import { formatToEthiopianDate } from "@/lib/date-utils";
import { getTopDiagnosedDiseases } from "@/features/clinical/actions";
import { TopDiseasesReport } from "@/features/admin/components/top-diseases-report";

export const metadata = {
  title: "Top Diagnosed Diseases & Morbidity Report | Clinic ERP",
};

export default async function TopDiseasesReportPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?reset=1");
  }

  const role = session.user.role || "User";
  const userPermissions = getUserPermissions(role);

  // Managers, Admins, Doctors or staff with HISTORY_READ / PATIENT_READ / USER_MANAGE can view morbidity reports
  const hasAccess =
    role === "Admin" ||
    role === "Manager" ||
    role === "Doctor" ||
    userPermissions.includes(PERMISSIONS.HISTORY_READ) ||
    userPermissions.includes(PERMISSIONS.PATIENT_READ) ||
    userPermissions.includes(PERMISSIONS.USER_MANAGE);

  if (!hasAccess) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Access Denied</h2>
        <p className="text-slate-600 dark:text-slate-400">
          You do not have permission to view the Top Diagnosed Diseases &amp; Morbidity Report.
        </p>
      </div>
    );
  }

  const now = new Date();

  const [
    clinicNameSetting,
    clinicNameAmharicSetting,
    clinicLogoSetting,
    topDiseases,
  ] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "clinicName" } }),
    prisma.systemSetting.findUnique({ where: { key: "clinicNameAmharic" } }),
    prisma.systemSetting.findUnique({ where: { key: "clinicLogo" } }),
    getTopDiagnosedDiseases(20, "all"),
  ]);

  let clinicLogo = clinicLogoSetting?.value || null;
  try {
    const fs = await import("fs");
    const path = await import("path");
    const iconFile = path.join(process.cwd(), "public", "icon.png");
    if (fs.existsSync(iconFile)) {
      const stat = fs.statSync(iconFile);
      clinicLogo = `/icon.png?v=${stat.mtimeMs}`;
    }
  } catch (e) {
    if (!clinicLogo) clinicLogo = "/icon.png";
  }

  const currentEthiopianDateStr = formatToEthiopianDate(now, { includeTime: false, amharic: false });
  const currentEthiopianDateAmharic = formatToEthiopianDate(now, { includeTime: false, amharic: true });

  const clinicInfo = {
    name: clinicNameSetting?.value || "Homicho Ammunition Engineering Industry Clinic",
    nameAmharic: clinicNameAmharicSetting?.value || "ሆሚቾ አሙኒሽን ኢንጅነሪንግ ኢንዱስትሪ ክሊኒክ",
    logo: clinicLogo,
    userName: session.user.name || "Clinic Staff",
    userRole: role,
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      <TopDiseasesReport
        initialDiseases={topDiseases}
        clinicInfo={clinicInfo}
        currentEthiopianDateStr={currentEthiopianDateStr}
        currentEthiopianDateAmharic={currentEthiopianDateAmharic}
      />
    </div>
  );
}
