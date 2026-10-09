"use client";

import React, { useState, Fragment } from "react";
import { updateDrug, toggleDrugAvailability } from "../actions";
import { Loader2, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";

export function EditableDrugRow({ drug }: { 
  drug: { 
    id: string; 
    name: string; 
    description: string | null; 
    category: string | null; 
    price: number; 
    isOperational?: boolean;
    batches?: any[];
  } 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(drug.name);
  const [description, setDescription] = useState(drug.description || "");
  const [category, setCategory] = useState(drug.category || "");
  const [priceStr, setPriceStr] = useState((drug.price / 100).toFixed(2));

  async function handleSave() {
    setLoading(true);
    const res = await updateDrug({
      id: drug.id,
      name,
      description: description || undefined,
      category: category || undefined,
      price: Math.round(parseFloat(priceStr) * 100)
    });
    setLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      if (res?.data && typeof res.data === "object" && "success" in res.data) {
        toast.success(res.data.success as string);
      }
      setIsEditing(false);
    }
  }

  const batches = drug.batches && drug.batches.length > 0 ? drug.batches : [null];
  const rowSpan = batches.length;

  const formatDate = (dateInput: any) => {
    if (!dateInput) return "N/A";
    try {
      const d = new Date(dateInput);
      return d.toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800">
        <td colSpan={11} className="px-4 py-4">
          <div className="space-y-3 max-w-4xl">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2 py-1 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Category</label>
                <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Antibiotics" className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2 py-1 text-sm" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2 py-1 text-sm" />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Price (ETB)</label>
                <input type="number" step="0.01" value={priceStr} onChange={e => setPriceStr(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2 py-1 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setIsEditing(false)} disabled={loading} className="px-3 py-1 text-xs border border-slate-300 rounded text-slate-600 hover:bg-slate-100 flex items-center">
                <X className="w-3 h-3 mr-1" /> Cancel
              </button>
              <button onClick={handleSave} disabled={loading} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center disabled:opacity-50">
                {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />} Save
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <Fragment>
      {batches.map((batch, index) => (
        <tr key={batch ? batch.id : `no-batch-${drug.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group border-b border-slate-100 dark:border-slate-800 last:border-0">
          {index === 0 && (
            <>
              <td className="px-4 py-3 align-top" rowSpan={rowSpan}>
                <button
                  onClick={async () => {
                    setLoading(true);
                    const res = await toggleDrugAvailability({ id: drug.id, isOperational: !drug.isOperational });
                    setLoading(false);
                    if (res?.error) toast.error(res.error);
                  }}
                  disabled={loading}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 ${drug.isOperational !== false ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"}`}
                  title={drug.isOperational !== false ? "Mark as Unavailable" : "Mark as Available"}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${drug.isOperational !== false ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </td>
              <td className="px-4 py-3 align-top font-medium text-slate-900 dark:text-slate-100" rowSpan={rowSpan}>
                {drug.name}
              </td>
              <td className="px-4 py-3 align-top" rowSpan={rowSpan}>
                {drug.category ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                    {drug.category}
                  </span>
                ) : <span className="text-slate-400">-</span>}
              </td>
              <td className="px-4 py-3 align-top font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap" rowSpan={rowSpan}>
                {(drug.price / 100).toFixed(2)} ETB
              </td>
            </>
          )}

          <td className="px-4 py-3 align-top whitespace-nowrap">
            {batch ? <span className="font-medium">{batch.quantity}</span> : <span className="text-slate-400">N/A</span>}
          </td>
          <td className="px-4 py-3 align-top whitespace-nowrap font-mono text-xs">
            {batch ? batch.batchNumber : <span className="text-slate-400">N/A</span>}
          </td>
          <td className="px-4 py-3 align-top whitespace-nowrap text-xs text-slate-500">
            {batch ? formatDate(batch.expiryDate) : <span className="text-slate-400">N/A</span>}
          </td>
          <td className="px-4 py-3 align-top whitespace-nowrap text-xs text-slate-500">
            {batch ? formatDate(batch.dateAddedToStock) : <span className="text-slate-400">N/A</span>}
          </td>
          <td className="px-4 py-3 align-top whitespace-nowrap text-xs text-slate-500">
            {batch && batch.docNo ? batch.docNo : <span className="text-slate-400">-</span>}
          </td>

          {index === 0 && (
            <>
              <td className="px-4 py-3 align-top text-xs text-slate-500 max-w-[200px] truncate" rowSpan={rowSpan} title={drug.description || ""}>
                {drug.description || <span className="text-slate-400">-</span>}
              </td>
              <td className="px-4 py-3 align-top text-right print:hidden" rowSpan={rowSpan}>
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-blue-600" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={async () => {
                      if(confirm("Are you sure you want to remove this drug?")) {
                        const { deleteDrug } = await import("../actions");
                        const res = await deleteDrug({ id: drug.id });
                        if (res?.error) toast.error(res.error);
                        else if (res?.data && typeof res.data === "object" && "success" in res.data) toast.success(res.data.success as string);
                      }
                    }} 
                    className="text-slate-400 hover:text-red-600" title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </>
          )}
        </tr>
      ))}
    </Fragment>
  );
}
