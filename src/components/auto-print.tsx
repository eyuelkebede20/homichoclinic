"use client";

import { useEffect } from "react";

export function AutoPrint() {
  useEffect(() => {
    // Small delay ensures layout is painted before printing
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
