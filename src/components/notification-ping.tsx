"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function NotificationPing({ endpoint }: { endpoint?: string }) {
  const router = useRouter();

  useEffect(() => {
    // Poll every 30 seconds to refresh the server component data
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  return null; // This is an invisible background poller
}
