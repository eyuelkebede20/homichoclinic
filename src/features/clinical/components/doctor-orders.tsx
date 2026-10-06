"use client";

import { useState } from "react";
import { requestLabTest, createPrescription } from "../actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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

  async function handleLabSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedTests.size === 0) {
      toast.success("Select at least one test.");
      return;
    }
    
    setLoading(true);
    
    const res = await requestLabTest({ patientId, testIds: Array.from(selectedTests) });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Lab tests requested.");
      setSelectedTests(new Set());
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
    
    // Filter out invalid items
    const validItems = rxItems.filter(i => i.drugId && i.quantity > 0 && i.instructions);
    
    if (validItems.length === 0) {
      toast.success("Please complete at least one prescription item.");
      setLoading(false);
      return;
    }

    const res = await createPrescription({ patientId, items: validItems });
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
      <div id="lab-request" className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800 scroll-mt-24">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Request Lab Tests</h3>
        <form onSubmit={handleLabSubmit} className="space-y-4">
          <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-md p-4 bg-slate-50 dark:bg-slate-950 flex flex-wrap gap-2">
            {labTests.map(t => {
              const isSelected = selectedTests.has(t.id);
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => toggleTest(t.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-200 ${
                    isSelected 
                      ? "bg-indigo-100 border-indigo-500 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-400 dark:text-indigo-300 shadow-sm" 
                      : "bg-white border-slate-300 text-slate-700 hover:border-indigo-300 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-700"
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
            {labTests.length === 0 && <span className="text-sm text-slate-500">No operational tests available.</span>}
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={loading || selectedTests.size === 0} className="py-2 px-6 rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Send ${selectedTests.size > 0 ? selectedTests.size : ""} Test(s) to Lab`}
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
