"use client";

import { useState } from "react";
import { requestLabTest, createPrescription } from "../actions";
import { Loader2, FlaskConical, Droplet, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { isStoolTest, isUrineTest, isHematologyTest } from "../types/lab-panels";

export function DoctorOrders({ 
  patientId, 
  labTests, 
  drugs 
}: { 
  patientId: string;
  labTests: { id: string; name: string }[];
  drugs: { id: string; name: string }[];
}) {
  const [loading, setLoading] = useState(false);
  const [rxItems, setRxItems] = useState([{ drugId: "", search: "", quantity: 1, instructions: "" }]);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [isUrgent, setIsUrgent] = useState(false);

  // Identify the 3 core default tests from the catalog or fallback
  const stoolTest = labTests.find(t => isStoolTest(t.name));
  const urineTest = labTests.find(t => isUrineTest(t.name));
  const hematologyTest = labTests.find(t => isHematologyTest(t.name));

  const coreIds = new Set([stoolTest?.id, urineTest?.id, hematologyTest?.id].filter(Boolean));
  const otherTests = labTests.filter(t => !coreIds.has(t.id));

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
              {/* 1. Stool Examination - Green */}
              {stoolTest ? (
                <button
                  type="button"
                  onClick={() => toggleTest(stoolTest.id)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all ${
                    selectedTests.has(stoolTest.id)
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-md scale-[1.01]"
                      : "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200 hover:border-emerald-400"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${selectedTests.has(stoolTest.id) ? "bg-white/20 text-white" : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"}`}>
                        <FlaskConical className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm">Stool Examination</span>
                    </div>
                    {selectedTests.has(stoolTest.id) && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <p className={`text-[11px] mt-1 line-clamp-2 ${selectedTests.has(stoolTest.id) ? "text-emerald-100" : "text-slate-500 dark:text-slate-400"}`}>
                    Macroscopic, occult blood, pus/mucus & microscopic ova/parasite
                  </p>
                </button>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  Stool Examination (Available in general list)
                </div>
              )}

              {/* 2. Urine Examination - Yellow/Amber */}
              {urineTest ? (
                <button
                  type="button"
                  onClick={() => toggleTest(urineTest.id)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all ${
                    selectedTests.has(urineTest.id)
                      ? "bg-amber-500 text-white border-amber-600 shadow-md scale-[1.01]"
                      : "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200 hover:border-amber-400"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${selectedTests.has(urineTest.id) ? "bg-white/20 text-white" : "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300"}`}>
                        <Droplet className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm">Urine Examination</span>
                    </div>
                    {selectedTests.has(urineTest.id) && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <p className={`text-[11px] mt-1 line-clamp-2 ${selectedTests.has(urineTest.id) ? "text-amber-100" : "text-slate-500 dark:text-slate-400"}`}>
                    Physical, chemical dipstick (Albumin/Sugar/Ketones) & sediment
                  </p>
                </button>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-amber-300 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  Urine Examination (Available in general list)
                </div>
              )}

              {/* 3. Hematology - Blood-Red */}
              {hematologyTest ? (
                <button
                  type="button"
                  onClick={() => toggleTest(hematologyTest.id)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all ${
                    selectedTests.has(hematologyTest.id)
                      ? "bg-rose-700 text-white border-rose-800 shadow-md scale-[1.01]"
                      : "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-200 hover:border-rose-400"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${selectedTests.has(hematologyTest.id) ? "bg-white/20 text-white" : "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300"}`}>
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm">Hematology / CBC</span>
                    </div>
                    {selectedTests.has(hematologyTest.id) && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <p className={`text-[11px] mt-1 line-clamp-2 ${selectedTests.has(hematologyTest.id) ? "text-rose-100" : "text-slate-500 dark:text-slate-400"}`}>
                    WBC & diff %, RBC, Hgb, Hct, platelets, coagulation & ESR
                  </p>
                </button>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 flex items-center justify-center">
                  Hematology (Available in general list)
                </div>
              )}
            </div>
          </div>

          {/* Other Laboratory Tests */}
          {otherTests.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Additional Tests & Serology Catalog
              </h4>
              <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/70 dark:bg-slate-950/50 flex flex-wrap gap-2">
                {otherTests.map(t => {
                  const isSelected = selectedTests.has(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => toggleTest(t.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 ${
                        isSelected 
                          ? "bg-indigo-600 border-indigo-700 text-white shadow-sm" 
                          : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {t.name}
                    </button>
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
      <div id="prescription" className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800 scroll-mt-24">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Write Prescription</h3>
        <form onSubmit={handleRxSubmit} className="space-y-4">
          
          {rxItems.map((item, index) => (
            <div key={index} className="flex gap-4 items-start border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Search Drug</label>
                <input 
                  type="text"
                  required
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
                  className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm"
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
                  type="number" min="1" required
                  value={item.quantity}
                  onChange={e => {
                    const newItems = [...rxItems];
                    newItems[index].quantity = parseInt(e.target.value) || 1;
                    setRxItems(newItems);
                  }}
                  className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Instructions (Dosage)</label>
                <input 
                  type="text" required
                  placeholder="e.g. Take 1 pill twice a day"
                  value={item.instructions}
                  onChange={e => {
                    const newItems = [...rxItems];
                    newItems[index].instructions = e.target.value;
                    setRxItems(newItems);
                  }}
                  className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm"
                />
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
            <button type="submit" disabled={loading} className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign & Send to Pharmacy"}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
