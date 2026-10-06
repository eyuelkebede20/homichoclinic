import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { LayoutDashboard, Users, FlaskConical, Pill, Receipt, LogOut, Shield, Tags, Calendar, Activity } from "lucide-react";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalNotifications } from "@/components/global-notifications";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DoctorOpdSelector } from "@/features/clinical/components/doctor-opd-selector";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  // Fetch full user for custom fields like currentOpdRoom
  const [fullUser, clinicNameSetting, clinicLogoSetting, opdRoomsSetting] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.systemSetting.findUnique({ where: { key: "clinicName" } }),
    prisma.systemSetting.findUnique({ where: { key: "clinicLogo" } }),
    prisma.systemSetting.findUnique({ where: { key: "totalOpdRooms" } })
  ]);
  const clinicName = clinicNameSetting?.value || "Clinic System";
  const clinicLogo = clinicLogoSetting?.value || "";
  const totalRoomsCount = parseInt(opdRoomsSetting?.value || "5", 10);

  let gitHash = "unknown";
  try {
    const { execSync } = require("child_process");
    gitHash = execSync("git rev-parse --short HEAD").toString().trim();
  } catch (e) {
    // ignore
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  if (userPermissions.includes(PERMISSIONS.VISIT_READ)) {
    navItems.push({ name: "Appointments", href: "/visits", icon: Calendar });
  }
  if (userPermissions.includes(PERMISSIONS.PATIENT_READ)) {
    navItems.push({ name: "Patients", href: "/patients", icon: Users });
  }
  const isManagerOrAdmin = userPermissions.includes(PERMISSIONS.CATALOG_APPROVE) || ["Admin", "Manager"].includes(role);

  if (userPermissions.includes(PERMISSIONS.LAB_READ)) {
    navItems.push({ name: "Laboratory", href: "/laboratory", icon: FlaskConical });
  }
  if (isManagerOrAdmin || role === "Laboratory") {
    navItems.push({ name: "Lab Catalog", href: "/laboratory/catalog", icon: Tags });
  }
  
  if (userPermissions.includes(PERMISSIONS.INVENTORY_READ)) {
    navItems.push({ name: "Pharmacy", href: "/pharmacy", icon: Pill });
  }
  if (isManagerOrAdmin || role === "Pharmacy") {
    navItems.push({ name: "Pharmacy Catalog", href: "/pharmacy/catalog", icon: Tags });
  }
  if (isManagerOrAdmin) {
    navItems.push({ name: "Catalog Approvals", href: "/catalogs/approvals", icon: Activity });
  }
  if (userPermissions.includes(PERMISSIONS.INVOICE_READ)) {
    navItems.push({ name: "Billing", href: "/billing", icon: Receipt });
  }

  if (userPermissions.includes(PERMISSIONS.AUDIT_READ)) {
    navItems.push({ name: "Audit Logs", href: "/audit", icon: Activity });
  }

  if (userPermissions.includes(PERMISSIONS.USER_MANAGE)) {
    navItems.push({ name: "Admin", href: "/admin", icon: Shield });
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 print:bg-white print:h-auto">
      
      {/* Sidebar */}
      <div className="w-64 bg-slate-950 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800/50 print:hidden">
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2 overflow-hidden">
            {clinicLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clinicLogo} alt="Logo" className="h-8 w-8 object-contain rounded bg-white p-0.5 shrink-0" />
            ) : (
              <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center font-bold text-white shadow shrink-0">
                +
              </div>
            )}
            <span className="font-bold text-lg tracking-wide truncate" title={clinicName}>{clinicName}</span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {role === "Doctor" && (
            <div className="mb-6 px-3">
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">My Station</p>
                <DoctorOpdSelector initialRoom={fullUser?.currentOpdRoom || null} role={role} totalRoomsCount={totalRoomsCount} />
              </div>
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-colors group"
              >
                <Icon className="mr-3 flex-shrink-0 h-5 w-5 text-slate-400 group-hover:text-blue-200 transition-colors" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex flex-col w-full">
            <div className="flex items-center w-full mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
                <p className="text-xs font-medium text-slate-400 capitalize truncate">{session.user.role || "User"}</p>
              </div>
              <Link 
                href="/login" 
                className="ml-2 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="text-[10px] text-slate-600 text-center border-t border-slate-800/50 pt-2 mt-1">
              Version: {gitHash}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background text-foreground print:overflow-visible print:block">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm flex items-center justify-end px-8 print:hidden gap-4 sticky top-0 z-10">
          <GlobalNotifications />
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto print:overflow-visible print:p-0">
          {children}
        </main>
      </div>

    </div>
  );
}
