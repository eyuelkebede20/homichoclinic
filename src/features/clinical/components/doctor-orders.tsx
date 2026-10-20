"use client";

import { useState } from "react";
import { requestLabTest, createPrescription, saveReferral } from "../actions";
import { Loader2, FlaskConical, Droplet, Activity, AlertTriangle, CheckCircle, Send, X, Printer, Search } from "lucide-react";
import { toast } from "sonner";
import { isStoolTest, isUrineTest, isHematologyTest } from "../types/lab-panels";
import { openPrintReferralWindow } from "../utils/print-referral";

export function DoctorOrders({ 
  patient, 
  labTests, 
  drugs,
  referralDestinations = [],
  clinicNames
}: { 
  patient: any;
  labTests: { id: string; name: string }[];
  drugs: { id: string; name: string }[];
  referralDestinations?: string[];
  clinicNames?: { clinicName?: string; clinicNameAmharic?: string; clinicSubName?: string; clinicSubNameAmharic?: string; clinicLogo?: string };
}) {
  const patientId = patient.id;
  const [loading, setLoading] = useState(false);
  const [rxItems, setRxItems] = useState([{ drugId: "", search: "", quantity: 1, instructions: "" }]);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [labSearch, setLabSearch] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const [refType, setRefType] = useState("Standard Referral");
  const [refDest, setRefDest] = useState("");
  const [refReason, setRefReason] = useState("");

  // Stool Panel & Sub-tests
  const mainStoolTest = labTests.find(t => {
    const n = t.name.toLowerCase().trim();
    return n === "stool examination" || n === "stool test" || n === "stool (complete examination)" || (isStoolTest(t.name) && !t.name.includes("-"));
  }) || labTests.find(t => isStoolTest(t.name));
  const stoolSubTests = labTests.filter(t => isStoolTest(t.name) && t.id !== mainStoolTest?.id);
  const allStoolTestIds = new Set([mainStoolTest?.id, ...stoolSubTests.map(t => t.id)].filter(Boolean));

  // Urine Panel & Sub-tests
  const mainUrineTest = labTests.find(t => {
    const n = t.name.toLowerCase().trim();
    return n === "urine examination" || n === "routine urinalysis" || n === "urinalysis" || (isUrineTest(t.name) && !t.name.includes("-"));
  }) || labTests.find(t => isUrineTest(t.name));
  const urineSubTests = labTests.filter(t => isUrineTest(t.name) && t.id !== mainUrineTest?.id);
  const allUrineTestIds = new Set([mainUrineTest?.id, ...urineSubTests.map(t => t.id)].filter(Boolean));

  // Hematology Panel & Sub-tests
  const mainHematologyTest = labTests.find(t => {
    const n = t.name.toLowerCase().trim();
    return n === "hematology" || n === "hematology (complete cbc)" || (isHematologyTest(t.name) && !t.name.includes("-"));
  }) || labTests.find(t => isHematologyTest(t.name));
  const hematologySubTests = labTests.filter(t => isHematologyTest(t.name) && t.id !== mainHematologyTest?.id);
  const allHematologyTestIds = new Set([mainHematologyTest?.id, ...hematologySubTests.map(t => t.id)].filter(Boolean));

  const [showStoolPicker, setShowStoolPicker] = useState(false);
  const [showUrinePicker, setShowUrinePicker] = useState(false);
  const [showHematologyPicker, setShowHematologyPicker] = useState(false);

  const coreIds = new Set([
    ...Array.from(allStoolTestIds),
    ...Array.from(allUrineTestIds),
    ...Array.from(allHematologyTestIds),
  ].filter(Boolean));
  const otherTests = labTests.filter(t => !coreIds.has(t.id));
  const filteredOtherTests = labSearch.trim() 
    ? otherTests.filter(t => t.name.toLowerCase().includes(labSearch.toLowerCase().trim())) 
    : otherTests;

  // Counts and full-panel selections
  const selectedStoolCount = Array.from(selectedTests).filter(id => allStoolTestIds.has(id)).length;
  const isFullStoolSelected = mainStoolTest ? selectedTests.has(mainStoolTest.id) : false;

  const selectedUrineCount = Array.from(selectedTests).filter(id => allUrineTestIds.has(id)).length;
  const isFullUrineSelected = mainUrineTest ? selectedTests.has(mainUrineTest.id) : false;

  const selectedHematologyCount = Array.from(selectedTests).filter(id => allHematologyTestIds.has(id)).length;
  const isFullHematologySelected = mainHematologyTest ? selectedTests.has(mainHematologyTest.id) : false;

  async function handleLabSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedTests.size === 0) {
      toast.error("Please select at least one test.");
      return;
    }
    
    setLoading(true);
    
    const res = await requestLabTest({
      patientId,
      testIds: Array.from(selectedTests),
      isUrgent,
    });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success(isUrgent ? "URGENT lab order sent to laboratory!" : "Lab tests requested successfully.");
      setSelectedTests(new Set());
      setIsUrgent(false);
    }
  }

  function toggleTest(id: string) {
    const next = new Set(selectedTests);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTests(next);
  }

  async function handleRxSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    // Filter empty rows that the user hasn't typed anything in
    const filledItems = rxItems.filter(i => i.search || i.drugId || i.instructions);
    
    // Check if any filled item is invalid
    const invalidItems = filledItems.filter(i => !i.drugId || i.quantity <= 0 || !i.instructions.trim());
    
    if (filledItems.length === 0) {
      toast.success("Please complete at least one prescription item.");
      setLoading(false);
      return;
    }
    
    if (invalidItems.length > 0) {
      toast.error("One or more prescription items are invalid (e.g. out of stock or missing dosage). Please fix or remove them.");
      setLoading(false);
      return;
    }

    const res = await createPrescription({ patientId, items: filledItems as any });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Prescription sent to pharmacy.");
      setRxItems([{ drugId: "", search: "", quantity: 1, instructions: "" }]);
    }
  }

  async function handleReferralSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!refDest.trim() || !refReason.trim()) {
      toast.error("Destination and Reason are required.");
      return;
    }
    setLoading(true);
    const res = await saveReferral({
      patientId,
      type: refType,
      destination: refDest,
      reason: refReason
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

      setRefDest("");
      setRefReason("");
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Lab Request Form */}
      <div id="lab-request" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 scroll-mt-24 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Request Laboratory Tests
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Order routine panels and specialized laboratory investigations</p>
          </div>

          {/* Urgent / STAT Toggle */}
          <button
            type="button"
            onClick={() => setIsUrgent(!isUrgent)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              isUrgent
                ? "bg-red-600 text-white border-red-700 shadow-md animate-pulse ring-2 ring-red-400/50"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${isUrgent ? "text-white" : "text-amber-500"}`} />
            {isUrgent ? "⚡ MARKED AS URGENT (STAT)" : "Mark Order as Urgent"}
          </button>
        </div>

        <form onSubmit={handleLabSubmit} className="space-y-5">
          {/* Top 3 Core Special Tests */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Core Diagnostic Panels (Default & Routine)
              </h4>
              <span className="text-[11px] text-slate-400 italic">Click to select/unselect</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Stool Examination - Green with Selective Sub-test Picking */}
              <div
                className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all ${
                  selectedStoolCount > 0
                    ? "bg-emerald-700 text-white border-emerald-800 shadow-md"
                    : "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200 hover:border-emerald-400"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${selectedStoolCount > 0 ? "bg-white/20 text-white" : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"}`}>
                      <FlaskConical className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm block">Stool Examination</span>
                      <span className={`text-[10px] block ${selectedStoolCount > 0 ? "text-emerald-200" : "text-slate-400"}`}>
                        {selectedStoolCount === 0 
                          ? "Click to select or pick tests"
                          : isFullStoolSelected 
                            ? "Complete Stool Panel Selected"
                            : `${selectedStoolCount} specific test(s) selected`}
                      </span>
                    </div>
                  </div>
                  {selectedStoolCount > 0 && <CheckCircle className="w-4 h-4 text-white" />}
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50">
                  {mainStoolTest && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Set(selectedTests);
                        if (next.has(mainStoolTest.id)) {
                          next.delete(mainStoolTest.id);
                        } else {
                          // Select full panel and remove any sub-test IDs to avoid duplicates
                          stoolSubTests.forEach(st => next.delete(st.id));
                          next.add(mainStoolTest.id);
                        }
                        setSelectedTests(next);
                      }}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                        isFullStoolSelected
                          ? "bg-white text-emerald-800 shadow-sm"
                          : selectedStoolCount > 0
                            ? "bg-emerald-800/80 hover:bg-emerald-800 text-white border border-emerald-500"
                            : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200"
                      }`}
                    >
                      {isFullStoolSelected ? "✓ Full Stool" : "Order Full Stool"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowStoolPicker(!showStoolPicker)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                      showStoolPicker
                        ? "bg-white/30 text-white underline"
                        : selectedStoolCount > 0
                          ? "bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100 border border-emerald-500/50"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {showStoolPicker ? "Hide Specific Tests ▲" : "Pick Specific Tests ▼"}
                  </button>
                </div>

                {/* Sub-test Picker: Allows doctor to select individual stool tests */}
                {showStoolPicker && (
                  <div className="mt-3 pt-3 border-t border-emerald-300/40 dark:border-emerald-800/60 space-y-2 animate-in fade-in duration-200">
                    <p className={`text-[11px] font-bold ${selectedStoolCount > 0 ? "text-emerald-100" : "text-slate-700 dark:text-slate-300"}`}>
                      Select specific test(s) to send to lab (doesn't send everything):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {stoolSubTests.length > 0 ? (
                        stoolSubTests.map(sub => {
                          const isSubSelected = selectedTests.has(sub.id);
                          const label = sub.name.replace(/^Stool\s*-\s*/i, "");
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                const next = new Set(selectedTests);
                                if (mainStoolTest) next.delete(mainStoolTest.id);
                                if (isSubSelected) {
                                  next.delete(sub.id);
                                } else {
                                  next.add(sub.id);
                                }
                                setSelectedTests(next);
                              }}
                              className={`text-[10px] font-medium px-2 py-1 rounded-md border transition-all ${
                                isSubSelected
                                  ? "bg-white text-emerald-900 border-white font-bold shadow-xs"
                                  : selectedStoolCount > 0
                                    ? "bg-emerald-800/80 text-emerald-100 border-emerald-500 hover:bg-emerald-800"
                                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400"
                              }`}
                            >
                              {isSubSelected ? "✓ " : "+ "}{label}
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-[11px] opacity-80">
                          Full stool panel active. (Sub-tests will appear when catalog is initialized).
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Urine Examination - Yellow/Amber with Selective Sub-test Picking */}
              <div
                className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all ${
                  selectedUrineCount > 0
                    ? "bg-amber-600 text-white border-amber-700 shadow-md"
                    : "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200 hover:border-amber-400"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${selectedUrineCount > 0 ? "bg-white/20 text-white" : "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300"}`}>
                      <Droplet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm block">Urine Examination</span>
                      <span className={`text-[10px] block ${selectedUrineCount > 0 ? "text-amber-200" : "text-slate-400"}`}>
                        {selectedUrineCount === 0 
                          ? "Click to select or pick tests"
                          : isFullUrineSelected 
                            ? "Complete Urine Panel Selected"
                            : `${selectedUrineCount} specific test(s) selected`}
                      </span>
                    </div>
                  </div>
                  {selectedUrineCount > 0 && <CheckCircle className="w-4 h-4 text-white" />}
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-200/50 dark:border-amber-800/50">
                  {mainUrineTest && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Set(selectedTests);
                        if (next.has(mainUrineTest.id)) {
                          next.delete(mainUrineTest.id);
                        } else {
                          // Select full panel and remove any sub-test IDs to avoid duplicates
                          urineSubTests.forEach(st => next.delete(st.id));
                          next.add(mainUrineTest.id);
                        }
                        setSelectedTests(next);
                      }}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                        isFullUrineSelected
                          ? "bg-white text-amber-900 shadow-sm"
                          : selectedUrineCount > 0
                            ? "bg-amber-700/80 hover:bg-amber-700 text-white border border-amber-400"
                            : "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 hover:bg-amber-200"
                      }`}
                    >
                      {isFullUrineSelected ? "✓ Full Urine" : "Order Full Urine"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowUrinePicker(!showUrinePicker)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                      showUrinePicker
                        ? "bg-white/30 text-white underline"
                        : selectedUrineCount > 0
                          ? "bg-amber-700/60 hover:bg-amber-700 text-amber-100 border border-amber-400/50"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {showUrinePicker ? "Hide Specific Tests ▲" : "Pick Specific Tests ▼"}
                  </button>
                </div>

                {/* Sub-test Picker: Allows doctor to select individual urine tests */}
                {showUrinePicker && (
                  <div className="mt-3 pt-3 border-t border-amber-300/40 dark:border-amber-800/60 space-y-2 animate-in fade-in duration-200">
                    <p className={`text-[11px] font-bold ${selectedUrineCount > 0 ? "text-amber-100" : "text-slate-700 dark:text-slate-300"}`}>
                      Select specific test(s) to send to lab (doesn't send everything):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {urineSubTests.length > 0 ? (
                        urineSubTests.map(sub => {
                          const isSubSelected = selectedTests.has(sub.id);
                          const label = sub.name.replace(/^Urine\s*-\s*/i, "");
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                const next = new Set(selectedTests);
                                if (mainUrineTest) next.delete(mainUrineTest.id);
                                if (isSubSelected) {
                                  next.delete(sub.id);
                                } else {
                                  next.add(sub.id);
                                }
                                setSelectedTests(next);
                              }}
                              className={`text-[10px] font-medium px-2 py-1 rounded-md border transition-all ${
                                isSubSelected
                                  ? "bg-white text-amber-950 border-white font-bold shadow-xs"
                                  : selectedUrineCount > 0
                                    ? "bg-amber-700/80 text-amber-100 border-amber-400 hover:bg-amber-700"
                                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-amber-200 dark:border-amber-800 hover:border-amber-400"
                              }`}
                            >
                              {isSubSelected ? "✓ " : "+ "}{label}
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-[11px] opacity-80">
                          Full urinalysis panel active. (Sub-tests will appear when catalog is initialized).
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Hematology - Blood-Red with Selective Sub-test Picking */}
              <div
                className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all ${
                  selectedHematologyCount > 0
                    ? "bg-rose-700 text-white border-rose-800 shadow-md"
                    : "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-200 hover:border-rose-400"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${selectedHematologyCount > 0 ? "bg-white/20 text-white" : "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300"}`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm block">Hematology / CBC</span>
                      <span className={`text-[10px] block ${selectedHematologyCount > 0 ? "text-rose-200" : "text-slate-400"}`}>
                        {selectedHematologyCount === 0 
                          ? "Click to select or pick tests"
                          : isFullHematologySelected 
                            ? "Complete CBC Panel Selected"
                            : `${selectedHematologyCount} specific test(s) selected`}
                      </span>
                    </div>
                  </div>
                  {selectedHematologyCount > 0 && <CheckCircle className="w-4 h-4 text-white" />}
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-rose-200/50 dark:border-rose-800/50">
                  {mainHematologyTest && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Set(selectedTests);
                        if (next.has(mainHematologyTest.id)) {
                          next.delete(mainHematologyTest.id);
                        } else {
                          // Select full panel and remove any sub-test IDs to avoid duplicates
                          hematologySubTests.forEach(st => next.delete(st.id));
                          next.add(mainHematologyTest.id);
                        }
                        setSelectedTests(next);
                      }}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                        isFullHematologySelected
                          ? "bg-white text-rose-800 shadow-sm"
                          : selectedHematologyCount > 0
                            ? "bg-rose-800/80 hover:bg-rose-800 text-white border border-rose-500"
                            : "bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 hover:bg-rose-200"
                      }`}
                    >
                      {isFullHematologySelected ? "✓ Full CBC" : "Order Full CBC"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowHematologyPicker(!showHematologyPicker)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                      showHematologyPicker
                        ? "bg-white/30 text-white underline"
                        : selectedHematologyCount > 0
                          ? "bg-rose-800/60 hover:bg-rose-800 text-rose-100 border border-rose-500/50"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {showHematologyPicker ? "Hide Specific Tests ▲" : "Pick Specific Tests ▼"}
                  </button>
                </div>

                {/* Sub-test Picker: Allows doctor to select individual tests */}
                {showHematologyPicker && (
                  <div className="mt-3 pt-3 border-t border-rose-300/40 dark:border-rose-800/60 space-y-2 animate-in fade-in duration-200">
                    <p className={`text-[11px] font-bold ${selectedHematologyCount > 0 ? "text-rose-100" : "text-slate-700 dark:text-slate-300"}`}>
                      Select specific test(s) to send to lab (doesn't send everything):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {hematologySubTests.length > 0 ? (
                        hematologySubTests.map(sub => {
                          const isSubSelected = selectedTests.has(sub.id);
                          // Clean label by removing "Hematology - " prefix
                          const label = sub.name.replace(/^Hematology\s*-\s*/i, "");
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                const next = new Set(selectedTests);
                                // Uncheck full CBC if doctor is picking specific tests
                                if (mainHematologyTest) next.delete(mainHematologyTest.id);
                                if (isSubSelected) {
                                  next.delete(sub.id);
                                } else {
                                  next.add(sub.id);
                                }
                                setSelectedTests(next);
                              }}
                              className={`text-[10px] font-medium px-2 py-1 rounded-md border transition-all ${
                                isSubSelected
                                  ? "bg-white text-rose-900 border-white font-bold shadow-xs"
                                  : selectedHematologyCount > 0
                                    ? "bg-rose-800/80 text-rose-100 border-rose-500 hover:bg-rose-800"
                                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-rose-200 dark:border-rose-800 hover:border-rose-400"
                              }`}
                            >
                              {isSubSelected ? "✓ " : "+ "}{label}
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-[11px] opacity-80">
                          Full CBC panel active. (Sub-tests will appear when catalog is initialized).
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Other Laboratory Tests */}
          {otherTests.length > 0 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Additional Tests & Serology Catalog ({otherTests.length})
                </h4>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search catalog tests..."
                    value={labSearch}
                    onChange={e => setLabSearch(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-7 py-1.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  {labSearch && (
                    <button
                      type="button"
                      onClick={() => setLabSearch("")}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/70 dark:bg-slate-950/50 flex flex-wrap gap-2">
                {filteredOtherTests.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-2">No tests match "{labSearch}".</p>
                ) : (
                  filteredOtherTests.map(t => {
                    const isSelected = selectedTests.has(t.id);
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => toggleTest(t.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border-2 transition-all duration-150 ${
                          isSelected 
                            ? "bg-indigo-600 border-indigo-400 ring-2 ring-indigo-400/40 text-white font-bold shadow-sm" 
                            : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}{t.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Selected Tests Preview Banner */}
          {selectedTests.size > 0 && (
            <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border-2 border-indigo-300 dark:border-indigo-800 ring-2 ring-indigo-400/20 shadow-xs space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Selected Tests ({selectedTests.size}) - Ready to Request:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTests(new Set())}
                  className="text-[11px] text-red-600 dark:text-red-400 hover:underline font-semibold"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(selectedTests).map(id => {
                  const test = labTests.find(t => t.id === id);
                  if (!test) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-indigo-950 dark:text-indigo-200 border-2 border-indigo-400 dark:border-indigo-600 shadow-xs"
                    >
                      <span>★ {test.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleTest(id)}
                        className="text-slate-400 hover:text-red-600 ml-0.5"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500">
              {selectedTests.size === 0 ? (
                <span>No tests currently selected.</span>
              ) : (
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedTests.size} test(s) selected {isUrgent && <span className="text-red-600 font-bold ml-1">(STAT / Urgent)</span>}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || selectedTests.size === 0}
              className={`py-2 px-6 rounded-xl shadow-sm text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center gap-2 ${
                isUrgent ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Send {selectedTests.size > 0 ? selectedTests.size : ""} Test(s) to Lab
            </button>
          </div>
        </form>
      </div>

      {/* Prescription Form */}
      <div id="prescription" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 scroll-mt-24">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          Write Prescription
        </h3>
        <form onSubmit={handleRxSubmit} className="space-y-4">
          
          {rxItems.map((item, index) => (
            <div key={index} className="flex gap-4 items-start border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Search Drug</label>
                <input 
                  type="text"
                  placeholder="Type to search..."
                  value={item.search || ""}
                  onChange={e => {
                    const newItems = [...rxItems];
                    newItems[index].search = e.target.value;
                    const match = drugs.find(d => d.name.toLowerCase() === e.target.value.toLowerCase());
                    newItems[index].drugId = match ? match.id : "";
                    setRxItems(newItems);
                  }}
                  list={`drug-list-${index}`}
                  className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                />
                <datalist id={`drug-list-${index}`}>
                  {drugs.map(d => (
                    <option key={d.id} value={d.name} />
                  ))}
                </datalist>
                {!item.drugId && item.search && (
                  <p className="text-xs text-red-500 mt-1">Please select a valid drug from the list.</p>
                )}
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Qty</label>
                <input 
                  type="number" min="1"
                  value={item.quantity}
                  onChange={e => {
                    const newItems = [...rxItems];
                    newItems[index].quantity = parseInt(e.target.value) || 1;
                    setRxItems(newItems);
                  }}
                  className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Instructions (Dosage)</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="e.g. Take 1 pill twice a day"
                    value={item.instructions}
                    onChange={e => {
                      const newItems = [...rxItems];
                      newItems[index].instructions = e.target.value;
                      setRxItems(newItems);
                    }}
                    className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                  />
                  {rxItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [...rxItems];
                        newItems.splice(index, 1);
                        setRxItems(newItems);
                      }}
                      className="mt-1 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                      title="Remove drug"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-2">
            <button 
              type="button" 
              onClick={() => setRxItems([...rxItems, { drugId: "", search: "", quantity: 1, instructions: "" }])}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              + Add another drug
            </button>
            <button type="submit" disabled={loading} className="py-2 px-6 rounded-xl shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-all flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Sign & Send to Pharmacy
            </button>
          </div>

        </form>
      </div>

      {/* Referral Form */}
      <div id="referral-form" className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 scroll-mt-24">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Send Patient Referral
        </h3>
        <p className="text-xs text-slate-500 mb-5">Generate a printable referral letter and save the destination for future use.</p>
        
        <form onSubmit={handleReferralSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Referral Type</label>
              <select 
                value={refType} 
                onChange={(e) => setRefType(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
              >
                <option value="Standard Referral">Standard Referral</option>
                <option value="Specialist Consultation">Specialist Consultation</option>
                <option value="Infrastructure / X-ray & Ultrasound">Infrastructure / X-ray & Ultrasound</option>
                <option value="Hospital (Transfer/Advanced Care)">Hospital (Transfer/Advanced Care)</option>
                <option value="Emergency Transfer">Emergency Transfer</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination Facility</label>
              <input 
                type="text"
                required
                value={refDest}
                onChange={(e) => setRefDest(e.target.value)}
                placeholder="Type or select from history"
                list="referral-destinations-list"
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
              />
              <datalist id="referral-destinations-list">
                {referralDestinations.map((dest, idx) => (
                  <option key={idx} value={dest} />
                ))}
              </datalist>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason & Findings</label>
            <textarea
              required
              rows={3}
              value={refReason}
              onChange={(e) => setRefReason(e.target.value)}
              placeholder="Detailed reason for referral, patient's current state, etc..."
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="button" 
              onClick={() => window.print()}
              className="py-2 px-4 rounded-xl shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
              title="Print the full patient medical history to attach with this referral"
            >
              <Printer className="w-4 h-4" />
              Print Patient History
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="py-2 px-6 rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Generate & Print Referral
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
