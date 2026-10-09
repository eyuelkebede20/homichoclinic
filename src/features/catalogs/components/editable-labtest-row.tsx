"use client";

import { useState } from "react";
import { updateLabTest, deleteLabTest } from "../actions";
import { toggleLabTestOperational } from "../actions-toggle";
import { Loader2, Edit2, Check, X, Tag } from "lucide-react";
import { toast } from "sonner";

export function EditableLabTestRow({ test }: { 
  test: { id: string; name: string; description: string | null; options?: string | null; price: number; isOperational?: boolean } 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(test.name);
  const [description, setDescription] = useState(test.description || "");
  const [options, setOptions] = useState(test.options || "");
  const [priceStr, setPriceStr] = useState((test.price / 100).toFixed(2));
  const [isOperational, setIsOperational] = useState(test.isOperational !== false);

  async function handleSave() {
    setLoading(true);
    const res = await updateLabTest({
      id: test.id,
      name,
      description: description || undefined,
      options: options || undefined,
      price: Math.round(parseFloat(priceStr) * 100)
    });
    setLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      if (res?.data && typeof res.data === "object" && "success" in res.data) {
        toast.success(res.data.success as string);
      } else {
        toast.success("Lab test updated successfully");
      }
      setIsEditing(false);
    }
  }

  async function handleToggleOperational() {
    setLoading(true);
    const nextStatus = !isOperational;
    const res = await toggleLabTestOperational({ id: test.id, isOperational: nextStatus });
    setLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      setIsOperational(nextStatus);
      toast.success("Test availability updated");
    }
  }

  const optionList = test.options
    ? test.options.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  if (isEditing) {
    return (
      <tr className="bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800">
        <td colSpan={6} className="px-4 py-4">
          <div className="space-y-3 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Test Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2 py-1 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Price (ETB)</label>
                <input type="number" step="0.01" value={priceStr} onChange={e => setPriceStr(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2 py-1 text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2 py-1 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Result Options (comma-separated)</label>
                <input 
                  value={options} 
                  onChange={e => setOptions(e.target.value)} 
                  placeholder="e.g. Positive, Negative, Inconclusive or A+, A-, B+, B-, O+, O-"
                  className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2 py-1 text-sm" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setIsEditing(false)} disabled={loading} className="px-3 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center">
                <X className="w-3 h-3 mr-1" /> Cancel
              </button>
              <button onClick={handleSave} disabled={loading} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center disabled:opacity-50 font-medium">
                {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />} Save
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 group border-b border-slate-100 dark:border-slate-800 ${!isOperational ? "opacity-70 bg-slate-50 dark:bg-slate-800/20" : ""}`}>
      <td className="px-4 py-3 align-top">
        <div className="flex items-center">
          <button
            onClick={handleToggleOperational}
            disabled={loading}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 ${isOperational ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"}`}
            title={isOperational ? "Mark as Out of Service" : "Mark as Operational"}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isOperational ? "translate-x-4" : "translate-x-0"}`} />
          </button>
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <span className={`font-medium text-sm ${!isOperational ? "line-through text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-slate-100"}`}>{test.name}</span>
        {!isOperational && <span className="hidden print:inline-block text-red-500 text-xs ml-2">(Out of Service)</span>}
      </td>
      <td className="px-4 py-3 align-top text-xs text-slate-500 max-w-[200px] truncate" title={test.description || ""}>
        {test.description || <span className="text-slate-400">-</span>}
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex flex-wrap items-center gap-1.5 max-w-[250px]">
          {optionList.length > 0 ? (
            optionList.map(opt => (
              <span key={opt} className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {opt}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-slate-400 italic">Default</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 align-top font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
        {(test.price / 100).toFixed(2)} ETB
      </td>
      <td className="px-4 py-3 align-top text-right print:hidden">
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-blue-600" title="Edit Test Details & Options">
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={async () => {
              if (confirm(`Are you sure you want to remove ${test.name}?`)) {
                setLoading(true);
                const res = await deleteLabTest({ id: test.id });
                setLoading(false);
                if (res?.error) toast.error(res.error);
                else if (res?.data && typeof res.data === "object" && "success" in res.data) toast.success(res.data.success as string);
              }
            }} 
            className="text-slate-400 hover:text-red-600" title="Remove Test"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
