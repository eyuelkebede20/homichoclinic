"use client";

import { HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { TUTORIALS } from "@/lib/tutorials";

export function SidebarTutorialToggle({ role }: { role: string }) {
  const pathname = usePathname();
  const [hasTutorial, setHasTutorial] = useState(false);

  useEffect(() => {
    const roleTutorials = TUTORIALS[role];
    if (!roleTutorials) {
      setHasTutorial(false);
      return;
    }

    let hasPageTutorial = !!(roleTutorials[pathname] && roleTutorials[pathname].length > 0);
    
    if (!hasPageTutorial) {
      const dynamicKey = Object.keys(roleTutorials).find(key => 
        key.endsWith('/*') && pathname.startsWith(key.replace('/*', '/'))
      );
      if (dynamicKey && roleTutorials[dynamicKey].length > 0) {
        hasPageTutorial = true;
      }
    }

    setHasTutorial(hasPageTutorial);
  }, [pathname, role]);

  if (!hasTutorial) return null;

  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("open-tutorial"))}
      className="ml-2 p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-md transition-colors"
      title="Restart Tutorial"
    >
      <HelpCircle className="h-4 w-4" />
    </button>
  );
}
