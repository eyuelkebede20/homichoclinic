import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { prisma } = await import("@/lib/prisma");
  let clinicName = "Clinic ERP";
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: "clinicName" } });
    if (setting) clinicName = setting.value;
  } catch (e) {}

  return {
    title: clinicName,
    description: "Integrated Healthcare Management System",
  };
}

import { ThemeProvider } from "@/components/theme-provider";
import { prisma } from "@/lib/prisma";
import { TestUserSwitcher } from "@/components/test-user-switcher";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the current logo file (if present) to use as favicon
  const fs = await import('fs');
  const path = await import('path');
  const logoFile = path.join(process.cwd(), 'public', 'icon.png');
  let logoPath: string | undefined = undefined;
  try {
    if (fs.existsSync(logoFile)) {
      const stat = fs.statSync(logoFile);
      logoPath = `/icon.png?v=${stat.mtimeMs}`;
    }
  } catch(e) {}

  // Gracefully handle db errors during initial build or if db is unreachable
  let isLowPower = true; // Default to true for OptiPlex machines
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: "lowPowerMode" } });
    if (setting?.value === "false") isLowPower = false;
  } catch (e) {
    console.error("Could not fetch lowPowerMode setting", e);
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-low-power={isLowPower}
      suppressHydrationWarning
    >
      <head>
        {logoPath && <link rel="icon" href={logoPath} />}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('ui-theme') || 'system';
                if (theme === 'system') {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark', 'light');
                  document.documentElement.classList.add(theme);
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
            <Toaster position="top-right" richColors />
          <TestUserSwitcher />
        </ThemeProvider>
      </body>
    </html>
  );
}
