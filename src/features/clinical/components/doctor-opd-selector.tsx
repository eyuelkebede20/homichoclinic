"use client";

import { useState } from "react";
import { updateDoctorOpd } from "@/features/clinical/actions";
import { Loader2, Stethoscope } from "lucide-react";
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
    const val = e.target.value; 
    const room = val === "off" ? null : parseInt(val);
    
    setLoading(true);
    await updateDoctorOpd({ room });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Stethoscope className="h-4 w-4 text-blue-400" />
        </div>
        <select 
          value={initialRoom === null ? "off" : initialRoom.toString()}
          onChange={handleChange}
          disabled={loading}
          className="w-full text-sm font-semibold bg-slate-950/50 hover:bg-slate-900 text-white border border-slate-700/50 hover:border-blue-500/50 rounded-xl py-2.5 pl-9 pr-8 outline-none transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-inner focus:ring-2 focus:ring-blue-500/30 appearance-none"
        >
          <option className="bg-slate-900 text-slate-100 font-medium py-2" value="off">☕ Off Duty / Roaming</option>
          <option className="bg-slate-900 text-blue-100 font-medium py-2" value="1">🏥 OPD Room 1</option>
          <option className="bg-slate-900 text-blue-100 font-medium py-2" value="2">🏥 OPD Room 2</option>
          <option className="bg-slate-900 text-blue-100 font-medium py-2" value="3">🏥 OPD Room 3</option>
          <option className="bg-slate-900 text-blue-100 font-medium py-2" value="4">🏥 OPD Room 4</option>
          <option className="bg-slate-900 text-blue-100 font-medium py-2" value="5">🏥 OPD Room 5</option>
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
          ) : (
            <svg className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          )}
        </div>
      </div>
    </div>
  );
}