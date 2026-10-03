"use client";

import { X } from "lucide-react";
import { toast } from "sonner";

export function RemoveLabTestButton({ id }: { id: string }) {
  return (
    <button 
      onClick={async () => {
        if (confirm("Are you sure you want to remove this lab test?")) {
          const { deleteLabTest } = await import("../actions");
          const res = await deleteLabTest({ id });
          if (res?.error) toast.error(res.error);
          else if (res?.data && typeof res.data === "object" && "success" in res.data) toast.success(res.data.success as string);
        }
      }} 
      className="text-slate-400 hover:text-red-600 transition-colors print:hidden" 
      title="Remove Test"
    >
      <X className="w-4 h-4" />
    </button>
  );
}
