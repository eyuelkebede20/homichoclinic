"use client";

import { useState, useEffect, useRef } from "react";
import { updateDoctorOpd } from "@/features/clinical/actions";
import { Loader2, Stethoscope, Search, X, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function DoctorOpdSelector({ 
  initialRoom,
  role,
  totalRoomsCount = 5
}: { 
  initialRoom: number | null,
  role: string,
  totalRoomsCount?: number 
}) {
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>(initialRoom === null ? "off" : initialRoom.toString());
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  
  const totalRooms = Array.from({ length: totalRoomsCount }, (_, i) => i + 1);

  useEffect(() => {
    setSelectedRoom(initialRoom === null ? "off" : initialRoom.toString());
  }, [initialRoom]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (role !== "Doctor") return null;

  const handleSelect = async (val: string) => {
    setIsOpen(false);
    setSelectedRoom(val);
    const room = val === "off" ? null : parseInt(val);
    
    setLoading(true);
    await updateDoctorOpd({ room });
    setLoading(false);
    
    if (room !== null && pathname !== "/dashboard") {
      router.push("/dashboard");
    } else {
      router.refresh();
    }
  };

  const filteredRooms = totalRooms.filter(room => room.toString().includes(search));

  const currentLabel = selectedRoom === "off" ? "Off Duty / Roaming" : `OPD Room ${selectedRoom}`;

  return (
    <div className="flex flex-col gap-2 w-full relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="w-full flex items-center justify-between text-sm font-semibold bg-slate-950/50 hover:bg-slate-900 text-white border border-slate-700/50 hover:border-blue-500/50 rounded-xl py-2.5 px-3 outline-none transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-inner focus:ring-2 focus:ring-blue-500/30"
      >
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-blue-400 shrink-0" />
          <span className="whitespace-normal break-words leading-tight text-left">{currentLabel}</span>
        </div>
        {loading ? (
          <Loader2 className="h-4 w-4 text-blue-400 animate-spin flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-700 flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search OPD..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-400 hover:text-white">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            <button
              onClick={() => handleSelect("off")}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${selectedRoom === "off" ? "bg-blue-600/20 text-blue-400" : "text-slate-300 hover:bg-slate-800"}`}
            >
              ☕ Off Duty / Roaming
            </button>
            {filteredRooms.map(room => (
              <button
                key={room}
                onClick={() => handleSelect(room.toString())}
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${selectedRoom === room.toString() ? "bg-blue-600/20 text-blue-400" : "text-slate-300 hover:bg-slate-800"}`}
              >
                🏥 OPD Room {room}
              </button>
            ))}
            {filteredRooms.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-slate-500">
                No rooms found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}