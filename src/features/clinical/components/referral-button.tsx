"use client";

import { useState } from "react";
import { Send, Loader2, X, Printer } from "lucide-react";
import { toast } from "sonner";
import { saveReferral } from "../actions";
import { openPrintReferralWindow } from "../utils/print-referral";

export function ReferralButton({
  patient,
  referralDestinations = [],
  clinicNames,
  defaultReason = "",
}: {
  patient: any;
  referralDestinations?: string[];
  clinicNames?: { clinicName?: string; clinicNameAmharic?: string; clinicSubName?: string; clinicSubNameAmharic?: string; clinicLogo?: string };
  defaultReason?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [refType, setRefType] = useState("Standard Referral");
  const [refDest, setRefDest] = useState("");
  const [refReason, setRefReason] = useState(defaultReason);

  async function handleReferralSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!refDest.trim() || !refReason.trim()) {
      toast.error("Destination and Reason are required.");
      return;
    }
    setLoading(true);
    const res = await saveReferral({
      patientId: patient.id,
      type: refType,
      destination: refDest,
      reason: refReason,
    });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Referral created successfully.");
      
      openPrintReferralWindow({
        patient,
        destination: refDest,
        reason: refReason,
        clinicNames,
      });

      setIsOpen(false);
      setRefDest("");
      setRefReason("");
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600"
      >
        <Send className="w-3.5 h-3.5" />
        Generate Referral
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                Patient Referral
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="referral-form-modal" onSubmit={handleReferralSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Referral Type</label>
                    <select 
                      value={refType} 
                      onChange={(e) => setRefType(e.target.value)}
                      className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm"
                    >
                      <option value="Standard Referral">Standard Referral</option>
                      <option value="Specialist Consultation">Specialist Consultation</option>
                      <option value="Infrastructure / X-ray & Ultrasound">Infrastructure / X-ray & Ultrasound</option>
                      <option value="Hospital (Transfer/Advanced Care)">Hospital (Transfer/Advanced Care)</option>
                      <option value="Emergency Transfer">Emergency Transfer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Destination Facility</label>
                    <input 
                      type="text" required value={refDest} onChange={(e) => setRefDest(e.target.value)}
                      placeholder="Type or select from history" list="ref-dest-list-modal"
                      className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm"
                    />
                    <datalist id="ref-dest-list-modal">
                      {referralDestinations.map((dest, idx) => <option key={idx} value={dest} />)}
                    </datalist>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Reason & Findings</label>
                  <textarea
                    required rows={4} value={refReason} onChange={(e) => setRefReason(e.target.value)}
                    placeholder="Detailed reason for referral..."
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm"
                  />
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between bg-slate-50 dark:bg-slate-900/50">
              <button 
                type="button" 
                onClick={() => window.print()}
                className="py-2 px-4 rounded-xl text-sm font-medium border bg-white hover:bg-slate-50 dark:bg-slate-800 flex items-center gap-2"
                title="Print the full patient medical history"
              >
                <Printer className="w-4 h-4" /> History
              </button>
              <button 
                type="submit" form="referral-form-modal" disabled={loading} 
                className="py-2 px-6 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Generate & Print
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
