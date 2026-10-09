"use client";

import React, { Fragment, useState } from "react";
import { Search, ChevronDown, ChevronRight, Package, Calendar } from "lucide-react";

export function InventoryManager({ drugs }: { 
  drugs: { 
    id: string; 
    name: string; 
    description: string | null;
    batches: { id: string; batchNumber: string; quantity: number; expiryDate: Date; createdAt: Date }[] 
  }[] 
}) {
  const [search, setSearch] = useState("");
  const [expandedDrug, setExpandedDrug] = useState<string | null>(null);

  const filteredDrugs = drugs.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggleExpand(drugId: string) {
    if (expandedDrug === drugId) {
      setExpandedDrug(null);
    } else {
      setExpandedDrug(drugId);
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
              <th className="text-right text-xs font-medium text-slate-500 uppercase py-2 pr-4">Total Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDrugs.map(drug => {
              const totalStock = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
              const isExpanded = expandedDrug === drug.id;

              return (
                <Fragment key={drug.id}>
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
                    <td className="py-3 text-sm text-right text-slate-600 dark:text-slate-400 pr-4">
                      {totalStock > 0 ? (
                        <span className="font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-xs">
                          {totalStock} in stock
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold text-xs bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">Out of Stock</span>
                      )}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-slate-50/50 dark:bg-slate-900/20">
                      <td colSpan={3} className="p-0 border-b border-slate-200 dark:border-slate-800">
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
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filteredDrugs.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-6 h-6 text-slate-300" />
                    <span>No medicines match your search &quot;{search}&quot;.</span>
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
