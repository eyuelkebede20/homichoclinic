"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { TUTORIALS, TutorialStep } from "@/lib/tutorials";
import { X, ChevronRight, ChevronLeft, Check, HelpCircle } from "lucide-react";

export function TutorialManager({ role }: { role: string }) {
  const pathname = usePathname();
  const [locale, setLocale] = useState<"en" | "am">("en");
  
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Sync locale
  useEffect(() => {
    const checkLocale = () => {
      const match = document.cookie.match(/(^| )locale=([^;]+)/);
      if (match && (match[2] === "en" || match[2] === "am")) {
        setLocale(match[2] as "en" | "am");
      }
    };
    checkLocale();
    const interval = setInterval(checkLocale, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load steps for the current route -- NEVER auto-open
  useEffect(() => {
    const roleTutorials = TUTORIALS[role];
    if (!roleTutorials) {
      setSteps([]);
      setIsOpen(false);
      return;
    }

    let pageSteps = roleTutorials[pathname];

    if (!pageSteps) {
      const dynamicKey = Object.keys(roleTutorials).find(key =>
        key.endsWith("/*") && pathname.startsWith(key.replace("/*", "/"))
      );
      if (dynamicKey) pageSteps = roleTutorials[dynamicKey];
    }

    setSteps(pageSteps && pageSteps.length > 0 ? pageSteps : []);
    setIsOpen(false); // Never auto-open
  }, [pathname, role]);

  // Open/toggle on "?" key (skip when typing in inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "?" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        if (steps.length > 0) {
          setCurrentStepIndex(0);
          setIsOpen(prev => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps]);

  // Listen to external open events (from the sidebar toggle button)
  useEffect(() => {
    const handleOpen = () => {
      setCurrentStepIndex(0);
      setIsOpen(true);
    };
    window.addEventListener("open-tutorial", handleOpen);
    return () => window.removeEventListener("open-tutorial", handleOpen);
  }, []);

  if (!isOpen || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsOpen(false);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              {locale === "en" ? "Page Tutorial" : "የገጽ መመሪያ"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {locale === "en" ? "Press ? anytime to reopen" : "? ን ጠቅ ያድርጉ እንደገና ለመክፈት"}
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h4 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-3">
            {currentStep.title[locale]}
          </h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {currentStep.content[locale]}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-sm font-medium text-slate-500">
            {currentStepIndex + 1} / {steps.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="p-2 text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
            >
              {currentStepIndex === steps.length - 1 ? (
                <>{locale === "en" ? "Finish" : "ጨርስ"}<Check className="w-4 h-4" /></>
              ) : (
                <>{locale === "en" ? "Next" : "ቀጣይ"}<ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
