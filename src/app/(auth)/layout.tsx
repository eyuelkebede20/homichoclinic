import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [clinicNameSetting, clinicLogoSetting] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "clinicName" } }),
    prisma.systemSetting.findUnique({ where: { key: "clinicLogo" } })
  ]);
  const clinicName = clinicNameSetting?.value || "Clinic ERP";
  let clinicLogo = clinicLogoSetting?.value || "";

  if (clinicLogo === "/icon.png") {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const stat = fs.statSync(path.join(process.cwd(), "public", "icon.png"));
      clinicLogo = `/icon.png?v=${stat.mtimeMs}`;
    } catch (e) {
      // ignore
    }
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
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clinicLogo} alt="Logo" className="w-16 h-16 object-contain rounded-xl bg-white p-1 mb-6 shadow-sm" />
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30 shadow-sm">
                <span className="text-2xl font-bold text-white">✚</span>
              </div>
            )}
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">
              {clinicName}
            </h1>
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
          {children}
          
          <div className="text-center text-slate-400 dark:text-slate-500 text-xs mt-12">
            Clinic ERP System &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
}
