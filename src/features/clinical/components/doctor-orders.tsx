"use client";

import { useState } from "react";
import { requestLabTest, createPrescription } from "../actions";
import { Loader2 } from "lucide-react";

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
  const [rxItems, setRxItems] = useState([{ drugId: "", quantity: 1, instructions: "" }]);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());

  async function handleLabSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedTests.size === 0) {
      alert("Select at least one test.");
      return;
    }
    
    setLoading(true);
    
    const res = await requestLabTest({ patientId, testIds: Array.from(selectedTests) });
    setLoading(false);
    if (res.error) alert(res.error);
    else {
      alert("Lab tests requested.");
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
      alert("Please complete at least one prescription item.");
      setLoading(false);
      return;
    }

    const res = await createPrescription({ patientId, items: validItems });
    setLoading(false);
    if (res.error) alert(res.error);
    else {
      alert("Prescription sent to pharmacy.");
      setRxItems([{ drugId: "", quantity: 1, instructions: "" }]);
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Lab Request Form */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Request Lab Tests</h3>
        <form onSubmit={handleLabSubmit} className="space-y-4">
          <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-md p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950">
            {labTests.map(t => (
              <label key={t.id} className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                  checked={selectedTests.has(t.id)}
                  onChange={() => toggleTest(t.id)}
                />
                <span className="truncate" title={t.name}>{t.name}</span>
              </label>
            ))}
            {labTests.length === 0 && <span className="text-sm text-slate-500">No operational tests available.</span>}
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={loading || selectedTests.size === 0} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Send ${selectedTests.size > 0 ? selectedTests.size : ""} Test(s) to Lab`}
            </button>
          </div>
        </form>
      </div>

      {/* Prescription Form */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Write Prescription</h3>
        <form onSubmit={handleRxSubmit} className="space-y-4">
          
          {rxItems.map((item, index) => (
            <div key={index} className="flex gap-4 items-start border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Drug</label>
                <select 
                  required
                  value={item.drugId}
                  onChange={e => {
                    const newItems = [...rxItems];
                    newItems[index].drugId = e.target.value;
                    setRxItems(newItems);
                  }}
                  className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm"
                >
                  <option value="">-- Choose a Drug --</option>
                  {drugs.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
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
              onClick={() => setRxItems([...rxItems, { drugId: "", quantity: 1, instructions: "" }])}
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
