"use client";

import { useState } from "react";
import { receiveStock } from "../actions";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export function InventoryManager({ drugs }: { 
  drugs: { 
    id: string; 
    name: string; 
    description: string | null;
    batches: { quantity: number; expiryDate: Date }[] 
  }[] 
}) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);

  const filteredDrugs = drugs.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAddStock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedDrug) return;
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const costDollars = parseFloat(formData.get("cost") as string);
    
    const data = {
      drugId: selectedDrug,
      batchNumber: formData.get("batchNumber") as string,
      expiryDate: formData.get("expiryDate") as string,
      quantity: parseInt(formData.get("quantity") as string, 10),
      cost: Math.round(costDollars * 100), // convert to minor units
    };

    const res = await receiveStock(data);
    setLoading(false);
    
    if (res.error) {
      toast.error(res.error);
    } else {
      setSelectedDrug(null);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900/50 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800/60 p-6 flex flex-col h-[600px] print:h-auto print:block print:shadow-none print:border-none print:w-full print:p-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Inventory Status</h2>
      </div>

      <div className="relative mb-4 print:hidden">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search medicines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md leading-5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto print:overflow-visible">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
            <tr>
              <th className="text-left text-xs font-medium text-slate-500 uppercase py-2">Drug</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase py-2">Description</th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase py-2">Total Stock</th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase py-2 print:hidden">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDrugs.map(drug => {
              const totalStock = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
              const isAdding = selectedDrug === drug.id;

              return (
                <tr key={drug.id} className="print:break-inside-avoid">
                  <td className="py-3 text-sm font-medium text-slate-800 dark:text-slate-200">{drug.name}</td>
                  <td className="py-3 text-sm text-slate-500">{drug.description}</td>
                  <td className="py-3 text-sm text-right text-slate-600 dark:text-slate-400">
                    {totalStock > 0 ? totalStock : (
                      <span className="text-red-500 font-bold text-xs bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">Out of Stock</span>
                    )}
                  </td>
                  <td className="py-3 text-sm text-right print:hidden">
                    {isAdding ? (
                      <button onClick={() => setSelectedDrug(null)} className="text-slate-500 hover:text-slate-700 text-xs">Cancel</button>
                    ) : (
                      <button onClick={() => setSelectedDrug(drug.id)} className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center justify-end w-full">
                        <Plus className="w-3 h-3 mr-1" /> Add Stock
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredDrugs.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-sm text-slate-500">No drugs match search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedDrug && (
        <form onSubmit={handleAddStock} className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4">
          <h4 className="text-sm font-semibold mb-2 text-slate-800 dark:text-slate-200">
            Add Stock: {drugs.find(d => d.id === selectedDrug)?.name}
          </h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-slate-500">Batch Number</label>
              <input required name="batchNumber" type="text" className="mt-1 block w-full rounded border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2 py-1 text-sm" placeholder="e.g. BATCH-001" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Expiry Date</label>
              <input required name="expiryDate" type="date" className="mt-1 block w-full rounded border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Quantity</label>
              <input required name="quantity" type="number" min="1" className="mt-1 block w-full rounded border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2 py-1 text-sm" placeholder="100" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Total Batch Cost (ETB)</label>
              <input required name="cost" type="number" step="0.01" min="0" className="mt-1 block w-full rounded border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2 py-1 text-sm" placeholder="50.00" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full flex justify-center items-center py-1.5 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Batch"}
          </button>
        </form>
      )}
    </div>
  );
}
