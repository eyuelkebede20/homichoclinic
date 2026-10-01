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
    const room = parseInt(e.target.value);
    if (!room) return;
    
    setLoading(true);
    await updateDoctorOpd({ room });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-100 dark:border-blue-800 ml-4">
      {loading ? (
        <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
      ) : (
        <DoorOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      )}
      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Working In:</span>
      <select 
        value={initialRoom || ""}
        onChange={handleChange}
        disabled={loading}
        className="text-sm font-bold bg-transparent border-none text-blue-900 dark:text-blue-200 focus:ring-0 cursor-pointer p-0 pr-4"
      >
        <option value="" disabled>Select OPD</option>
        <option value="1">OPD 1</option>
        <option value="2">OPD 2</option>
        <option value="3">OPD 3</option>
        <option value="4">OPD 4</option>
        <option value="5">OPD 5</option>
        <option value="6">OPD 6</option>
      </select>
    </div>
  );
}
