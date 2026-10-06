"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const router = useRouter();
  const [locale, setLocale] = React.useState("en");

  React.useEffect(() => {
    // Read from document.cookie on mount
    const match = document.cookie.match(/(^| )locale=([^;]+)/);
    if (match) {
      setLocale(match[2]);
    }
  }, []);

  const toggleLanguage = () => {
    const newLocale = locale === "en" ? "am" : "en";
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`; // 1 year
    setLocale(newLocale);
    router.refresh(); // Force server components to re-render
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 p-1.5 -mr-2 rounded-md bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      title="Toggle Language / ቋንቋ ቀይር"
    >
      <Globe className="w-4 h-4" />
      <span className="text-xs font-bold leading-none w-5 text-center">
        {locale === "en" ? "EN" : "አማ"}
      </span>
    </button>
  );
}
