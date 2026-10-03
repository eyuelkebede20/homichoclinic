"use client";

import { useState } from "react";
import { updateDoctorOpd } from "@/features/clinical/actions";
import { DoorOpen, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function DoctorOpdSelector({ 
  initialRoom,
  role
}: { 
  initialRoom: number | null,
  role: string 
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (role !== "Doctor") return null;

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value; const room = val === "off" ? null : parseInt(val);
    if (room === undefined || isNaN(room as number)) return;
    
    setLoading(true);
    await updateDoctorOpd({ room });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative">
        <select 
          value={initialRoom || ""}
          onChange={handleChange}
          disabled={loading}
          className="w-full text-sm font-medium bg-slate-900 text-white border border-slate-700 rounded-md py-2 pl-3 pr-8 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer disabled:opacity-50 transition-colors"
        >
          <option className="bg-slate-800 text-slate-100" value="" disabled>Select OPD Station</option>
          <option className="bg-slate-800 text-slate-100" value="off">Off Duty / Roaming</option>
          <option className="bg-slate-800 text-slate-100" value="1">OPD 1</option>
          <option className="bg-slate-800 text-slate-100" value="2">OPD 2</option>
          <option className="bg-slate-800 text-slate-100" value="3">OPD 3</option>
          <option className="bg-slate-800 text-slate-100" value="4">OPD 4</option>
        </select>
        {loading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
