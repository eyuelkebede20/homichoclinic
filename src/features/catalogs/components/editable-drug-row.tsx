"use client";

import { useState } from "react";
import { updateDrug } from "../actions";
import { Loader2, Edit2, Check, X } from "lucide-react";

export function EditableDrugRow({ drug }: { 
  drug: { id: string; name: string; description: string | null; category: string | null; price: number } 
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
      alert(res.error);
    } else {
      if ((res as any)?.success) {
        alert((res as any).success);
      }
      setIsEditing(false);
    }
  }

  if (isEditing) {
    return (
      <li className="p-4 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800 space-y-3">
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
      </li>
    );
  }

  return (
    <li className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-medium text-sm text-slate-900 dark:text-slate-100">{drug.name}</span>
          {drug.category && <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">{drug.category}</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-slate-500">{(drug.price / 100).toFixed(2)} ETB</span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 print:hidden">
            <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-blue-600" title="Edit">
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={async () => {
                if(confirm("Are you sure you want to remove this drug?")) {
                  const { deleteDrug } = await import("../actions");
                  const res = await deleteDrug({ id: drug.id });
                  if (res?.error) alert(res.error);
                  else if ((res as any)?.success) alert((res as any).success);
                }
              }} 
              className="text-slate-400 hover:text-red-600" title="Remove"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {drug.description && <p className="text-xs text-slate-500 mt-1">{drug.description}</p>}
    </li>
  );
}
