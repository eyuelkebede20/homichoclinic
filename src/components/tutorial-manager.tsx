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
    // A primitive observer if the cookie changes via the toggle on the same page
    const interval = setInterval(checkLocale, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine if there are tutorials for the current route and role
  useEffect(() => {
    const roleTutorials = TUTORIALS[role];
    if (!roleTutorials) {
      setIsOpen(false);
      return;
    }

    let pageSteps = roleTutorials[pathname];
    let matchedKey = pathname;

    // Support wildcard matching like "/patients/*"
    if (!pageSteps) {
      const dynamicKey = Object.keys(roleTutorials).find(key => 
        key.endsWith('/*') && pathname.startsWith(key.replace('/*', '/'))
      );
      if (dynamicKey) {
        pageSteps = roleTutorials[dynamicKey];
        matchedKey = dynamicKey;
      }
    }

    if (pageSteps && pageSteps.length > 0) {
      const storageKey = `tutorial_seen_${role}_${matchedKey}`;
      const hasSeen = localStorage.getItem(storageKey);
      
      if (!hasSeen) {
        setSteps(pageSteps);
        setCurrentStepIndex(0);
        setIsOpen(true);
      } else {
        setSteps(pageSteps); // Store steps anyway so 'open-tutorial' works
        setIsOpen(false);
      }
    } else {
      setSteps([]);
      setIsOpen(false);
    }
  }, [pathname, role]);

  // Listen to external open events (from the sidebar toggle)
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
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    const roleTutorials = TUTORIALS[role];
    let matchedKey = pathname;
    if (roleTutorials && !roleTutorials[pathname]) {
      const dynamicKey = Object.keys(roleTutorials).find(key => 
        key.endsWith('/*') && pathname.startsWith(key.replace('/*', '/'))
      );
      if (dynamicKey) matchedKey = dynamicKey;
    }
    localStorage.setItem(`tutorial_seen_${role}_${matchedKey}`, "true");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
            {locale === "en" ? "Page Tutorial" : "የገጽ መመሪያ"}
          </h3>
          <button 
            onClick={handleClose}
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
                <>
                  {locale === "en" ? "Finish" : "ጨርስ"}
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  {locale === "en" ? "Next" : "ቀጣይ"}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
