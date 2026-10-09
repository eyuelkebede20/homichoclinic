"use client";

import { useState } from "react";
import { receiveStock } from "../actions";
import { Loader2, Plus, Search, ChevronDown, ChevronRight, Package, Calendar } from "lucide-react";
import { toast } from "sonner";

export function InventoryManager({ drugs }: { 
  drugs: { 
    id: string; 
    name: string; 
    description: string | null;
    batches: { id: string; batchNumber: string; quantity: number; expiryDate: Date; createdAt: Date }[] 
  }[] 
}) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);
  const [expandedDrug, setExpandedDrug] = useState<string | null>(null);

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
      dateAddedToStock: formData.get("dateAddedToStock") as string || undefined,
      docNo: formData.get("docNo") as string || undefined,
    };

    const res = await receiveStock(data);
    setLoading(false);
    
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Stock added successfully!");
      setSelectedDrug(null);
    }
  }

  function toggleExpand(drugId: string) {
    if (expandedDrug === drugId) {
      setExpandedDrug(null);
    } else {
      setExpandedDrug(drugId);
      // Auto-close the add stock form if it was open for a different drug
      if (selectedDrug && selectedDrug !== drugId) {
        setSelectedDrug(null);
      }
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
          <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
            <tr>
              <th className="w-8 px-2 py-2"></th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase py-2">Drug</th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase py-2">Total Stock</th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase py-2 print:hidden pr-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDrugs.map(drug => {
              const totalStock = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
              const isAdding = selectedDrug === drug.id;
              const isExpanded = expandedDrug === drug.id;

              return (
                <React.Fragment key={drug.id}>
                  <tr 
                    className={`print:break-inside-avoid transition-colors cursor-pointer ${isExpanded ? "bg-slate-50 dark:bg-slate-800/30" : "hover:bg-slate-50 dark:hover:bg-slate-800/20"}`}
                    onClick={() => toggleExpand(drug.id)}
                  >
                    <td className="px-2 py-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </td>
                    <td className="py-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                      {drug.name}
                      {drug.description && <span className="text-xs text-slate-500 ml-2 font-normal truncate block sm:inline">{drug.description}</span>}
                    </td>
                    <td className="py-3 text-sm text-right text-slate-600 dark:text-slate-400">
                      {totalStock > 0 ? (
                        <span className="font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-xs">
                          {totalStock} in stock
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold text-xs bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">Out of Stock</span>
                      )}
                    </td>
                    <td className="py-3 text-sm text-right print:hidden pr-2">
                      {isAdding ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedDrug(null); }} 
                          className="text-slate-500 hover:text-slate-700 text-xs px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedDrug(drug.id); 
                            setExpandedDrug(drug.id); 
                          }} 
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center justify-end w-full"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add Stock
                        </button>
                      )}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-slate-50/50 dark:bg-slate-900/20">
                      <td colSpan={4} className="p-0 border-b border-slate-200 dark:border-slate-800">
                        <div className="px-10 py-4 space-y-4 shadow-inner">
                          <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                              <Package className="w-4 h-4" /> Active Batches
                            </h4>
                            {drug.batches.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {drug.batches.map(b => (
                                  <div key={b.id} className={`bg-white dark:bg-slate-900 border ${b.quantity === 0 ? "border-red-200 dark:border-red-900/50 opacity-60" : "border-slate-200 dark:border-slate-700"} rounded-lg p-3 shadow-sm flex flex-col justify-between`}>
                                    <div className="flex justify-between items-start mb-1">
                                      <span className={`text-xs font-bold font-mono ${b.quantity === 0 ? "text-slate-500" : "text-indigo-600 dark:text-indigo-400"}`}>{b.batchNumber}</span>
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${b.quantity === 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>Qty: {b.quantity}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                                      <Calendar className="w-3 h-3" /> 
                                      Exp: {new Date(b.expiryDate).toLocaleDateString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 italic py-2">No active stock available.</p>
                            )}
                          </div>

                          {isAdding && (
                            <form onSubmit={handleAddStock} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm mt-4">
                              <h4 className="text-sm font-bold mb-3 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2">
                                Receive New Stock
                              </h4>
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                <div>
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Batch Number</label>
                                  <input required name="batchNumber" type="text" className="block w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm" placeholder="e.g. BATCH-001" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Expiry Date</label>
                                  <input required name="expiryDate" type="date" className="block w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Quantity Added</label>
                                  <input required name="quantity" type="number" min="1" className="block w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm" placeholder="100" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Total Cost (ETB)</label>
                                  <input required name="cost" type="number" step="0.01" min="0" className="block w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm" placeholder="50.00" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Date Added (Optional)</label>
                                  <input name="dateAddedToStock" type="date" className="block w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Doc/Receipt No (Optional)</label>
                                  <input name="docNo" type="text" className="block w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm" placeholder="GRV-1234" />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setSelectedDrug(null)} className="px-4 py-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-md font-medium">
                                  Cancel
                                </button>
                                <button type="submit" disabled={loading} className="flex justify-center items-center py-1.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
                                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Batch"}
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {filteredDrugs.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-6 h-6 text-slate-300" />
                    <span>No medicines match your search "{search}".</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
