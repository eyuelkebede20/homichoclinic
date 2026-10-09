/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Loader2, FlaskConical, Droplet, Activity, TestTube, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { enterLabResult } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getLabPanelType } from "../types/lab-panels";
import { StoolResultForm } from "./stool-result-form";
import { UrineResultForm } from "./urine-result-form";
import { HematologyResultForm } from "./hematology-result-form";
import { ReferralButton } from "./referral-button";

export function LabDashboard({ 
  requests,
  referralDestinations = [],
  clinicNames
}: { 
  requests: any[];
  referralDestinations?: string[];
  clinicNames?: { clinicName: string; clinicNameAmharic: string; clinicSubName: string; clinicSubNameAmharic: string };
}) {
  const urgentCount = requests.filter(r => r.status === "urgent").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <FlaskConical className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Laboratory Worklist & Results Entry
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Process incoming diagnostic tests, specialized panels, and routine investigations.</p>
        </div>
        {urgentCount > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold animate-pulse shadow-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{urgentCount} STAT / URGENT Request{urgentCount > 1 ? "s" : ""} Waiting</span>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Pending Tests ({requests.length})</h3>
          <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full">
            {requests.length} in queue
          </span>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {requests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 italic flex flex-col items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="font-medium">No pending lab requests.</p>
              <p className="text-xs text-slate-400 mt-0.5">All patient diagnostic orders have been completed.</p>
            </div>
          ) : (
            requests.map(req => <LabRequestRow key={req.id} request={req} referralDestinations={referralDestinations} clinicNames={clinicNames} />)
          )}
        </div>
      </div>
    </div>
  );
}

function LabRequestRow({ 
  request,
  referralDestinations,
  clinicNames
}: { 
  request: any;
  referralDestinations?: string[];
  clinicNames?: { clinicName: string; clinicNameAmharic: string; clinicSubName: string; clinicSubNameAmharic: string };
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [genericFindings, setGenericFindings] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const isUrgent = request.status === "urgent";
  const panelType = getLabPanelType(request.test.name);

  async function handleSaveFindings(findingsString: string) {
    if (!findingsString.trim()) {
      toast.error("Please enter lab findings.");
      return;
    }
    setSaving(true);
    const res = await enterLabResult({ requestId: request.id, findings: findingsString });
    setSaving(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Lab results recorded successfully.");
      setIsExpanded(false);
      router.refresh();
    }
  }

  // Visual badges based on panel
  const getPanelBadge = () => {
    if (panelType === "STOOL") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <FlaskConical className="w-3 h-3 text-emerald-600" />
          Stool Examination
        </span>
      );
    }
    if (panelType === "URINE") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <Droplet className="w-3 h-3 text-amber-600" />
          Urine Examination
        </span>
      );
    }
    if (panelType === "HEMATOLOGY") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
          <Activity className="w-3 h-3 text-rose-600" />
          Hematology / CBC
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <TestTube className="w-3 h-3 text-slate-500" />
        General Test
      </span>
    );
  };

  return (
    <div className={`p-5 transition-colors ${isUrgent ? "bg-red-50/40 dark:bg-red-950/20" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"}`}>
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Left info */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">{request.test.name}</h4>
            {getPanelBadge()}
            {isUrgent && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-red-600 text-white shadow-sm animate-pulse">
                ⚡ STAT / URGENT
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-900 dark:text-slate-100">Patient:</span> {request.patient.firstName} {request.patient.lastName}
            {request.patient.contactNumber && <span className="text-xs text-slate-400 ml-2">({request.patient.contactNumber})</span>}
          </p>
          <p className="text-xs text-slate-400">
            Requested {new Date(request.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Action Toggle */}
        <div className="flex items-center gap-2">
          <ReferralButton 
            patient={request.patient}
            referralDestinations={referralDestinations}
            clinicNames={clinicNames}
            defaultReason={`Referred for ${request.test.name} evaluation.`}
          />
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 ${
                panelType === "STOOL"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : panelType === "URINE"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : panelType === "HEMATOLOGY"
                  ? "bg-rose-700 hover:bg-rose-800 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {panelType ? `Open ${request.test.name} Form` : "Enter Results"}
            </button>
          ) : (
            <button
              onClick={() => setIsExpanded(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Collapse Form
            </button>
          )}
        </div>
      </div>

      {/* Expanded Specialized or Generic Form */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          {panelType === "STOOL" && (
            <StoolResultForm
              onSubmit={handleSaveFindings}
              onCancel={() => setIsExpanded(false)}
              loading={saving}
            />
          )}

          {panelType === "URINE" && (
            <UrineResultForm
              onSubmit={handleSaveFindings}
              onCancel={() => setIsExpanded(false)}
              loading={saving}
            />
          )}

          {panelType === "HEMATOLOGY" && (
            <HematologyResultForm
              onSubmit={handleSaveFindings}
              onCancel={() => setIsExpanded(false)}
              loading={saving}
            />
          )}

          {!panelType && (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Diagnostic Findings / Result:
              </label>
              <textarea
                placeholder="Enter detailed laboratory findings, titers, or interpretation..."
                value={genericFindings}
                onChange={e => setGenericFindings(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                rows={3}
              />
              <div className="flex flex-wrap gap-1.5">
                {["Positive (+)", "Negative", "Reactive", "Non-Reactive", "Normal", "Trace", "Clear"].map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setGenericFindings(genericFindings ? `${genericFindings} ${chip}` : chip)}
                    className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  disabled={saving}
                  className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveFindings(genericFindings)}
                  disabled={saving || !genericFindings.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Save Findings
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}