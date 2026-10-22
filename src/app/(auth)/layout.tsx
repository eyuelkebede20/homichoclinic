import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let clinicNameSetting = null;
  let clinicNameAmharicSetting = null;
  let clinicLogoSetting = null;
  try {
    [clinicNameSetting, clinicNameAmharicSetting, clinicLogoSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "clinicName" } }),
      prisma.systemSetting.findUnique({ where: { key: "clinicNameAmharic" } }),
      prisma.systemSetting.findUnique({ where: { key: "clinicLogo" } })
    ]);
  } catch (e) {
    // Ignore db errors during static build
  }
  const clinicName = clinicNameSetting?.value || "Clinic ERP";
  const clinicNameAmharic = clinicNameAmharicSetting?.value || "";
  let clinicLogo = clinicLogoSetting?.value || "";

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row">
      {/* LEFT SIDE: Branding & Features */}
      <div className="hidden sm:flex sm:w-1/2 lg:w-5/12 bg-gradient-to-br from-blue-700 to-blue-900 flex-col justify-center px-12 lg:px-20 text-white relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <polygon fill="currentColor" points="0,0 100,0 100,20 0,100" />
          </svg>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            {clinicLogo ? (
              <div className="w-20 h-20 rounded-full overflow-hidden bg-white flex items-center justify-center mb-6 shadow-md border-2 border-white/40 ring-4 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={clinicLogo} alt={clinicName} className="w-full h-full object-cover rounded-full" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30 shadow-sm">
                <span className="text-3xl font-bold text-white">✚</span>
              </div>
            )}
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">
              {clinicName}
            </h1>
            {clinicNameAmharic ? (
              <p className="text-blue-100 text-xl font-amharic mb-3 opacity-95">
                {clinicNameAmharic}
              </p>
            ) : null}
            <p className="text-blue-100 text-lg leading-relaxed max-w-md">
              Integrated Healthcare Management System for Industrial Clinic.
            </p>
          </div>

          <div className="space-y-4 pt-6">
            {[
              "Patient Registration",
              "OPD & Doctor Consultation",
              "Laboratory & Pharmacy",
              "Reports",
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-300" />
                <span className="text-blue-50 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="w-full sm:w-1/2 lg:w-7/12 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md space-y-8">
          {/* Clinic Identity Badge directly on Primary Login Card */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            {clinicLogo ? (
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-700 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={clinicLogo} alt={clinicName} className="w-full h-full object-cover rounded-full" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-xs shrink-0">
                ✚
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight">
                {clinicName}
              </h2>
              {clinicNameAmharic ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-amharic truncate">
                  {clinicNameAmharic}
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Integrated Healthcare Management System
                </p>
              )}
            </div>
          </div>

          {children}
          
          <div className="text-center text-slate-400 dark:text-slate-500 text-xs mt-12">
            {clinicName} &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
}
