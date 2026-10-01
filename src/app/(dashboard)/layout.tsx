import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { LayoutDashboard, Users, FlaskConical, Pill, Receipt, LogOut, Shield, Tags, Calendar, Activity } from "lucide-react";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
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
  const fullUser = await prisma.user.findUnique({ where: { id: session.user.id } });

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  if (userPermissions.includes(PERMISSIONS.VISIT_READ)) {
    navItems.push({ name: "Visits", href: "/visits", icon: Calendar });
  }
  if (userPermissions.includes(PERMISSIONS.PATIENT_READ)) {
    navItems.push({ name: "Patients", href: "/patients", icon: Users });
  }
  if (userPermissions.includes(PERMISSIONS.LAB_READ)) {
    navItems.push({ name: "Laboratory", href: "/laboratory", icon: FlaskConical });
  }
  if (userPermissions.includes(PERMISSIONS.INVENTORY_READ)) {
    navItems.push({ name: "Pharmacy", href: "/pharmacy", icon: Pill });
  }
  if (userPermissions.includes(PERMISSIONS.INVENTORY_ADJUST)) {
    navItems.push({ name: "Catalogs", href: "/catalogs", icon: Tags });
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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 print:bg-white print:h-auto">
      
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 border-r border-slate-800 print:hidden">
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center font-bold text-white shadow">
              +
            </div>
            <span className="font-bold text-lg tracking-wide">Clinic System</span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-slate-300 hover:bg-blue-600 hover:text-white transition-colors group"
              >
                <Icon className="mr-3 flex-shrink-0 h-5 w-5 text-slate-400 group-hover:text-blue-200 transition-colors" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center w-full">
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
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background text-foreground print:overflow-visible print:block">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-8 shadow-sm print:hidden">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Top Nav</h2>
            {role === "Doctor" && (
              <DoctorOpdSelector initialRoom={fullUser?.currentOpdRoom || null} role={role} />
            )}
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto print:overflow-visible print:p-0">
          {children}
        </main>
      </div>

    </div>
  );
}
