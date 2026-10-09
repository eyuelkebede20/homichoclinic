"use client";

import React, { useState, Fragment } from "react";
import { updateDrug, toggleDrugAvailability } from "../actions";
import { receiveStock } from "@/features/pharmacy/actions";
import { Loader2, Edit2, Check, X, Plus, ChevronDown, ChevronRight, Package, Calendar } from "lucide-react";
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
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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
    if (res?.error) toast.error(res.error);
    else {
      toast.success("Drug updated successfully!");
      setIsEditing(false);
    }
  }

  async function handleAddStock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const costDollars = parseFloat(formData.get("cost") as string);
    
    const data = {
      drugId: drug.id,
      batchNumber: formData.get("batchNumber") as string,
      expiryDate: formData.get("expiryDate") as string,
      quantity: parseInt(formData.get("quantity") as string, 10),
      cost: Math.round(costDollars * 100),
      dateAddedToStock: formData.get("dateAddedToStock") as string || undefined,
      docNo: formData.get("docNo") as string || undefined,
    };

    const res = await receiveStock(data);
    setLoading(false);
    
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Stock added successfully!");
      setIsAddingStock(false);
    }
  }

  const batches = drug.batches && drug.batches.length > 0 ? drug.batches : [];
  const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
  const latestBatch = batches[0]; // Assuming ordered by date desc
  const previousBatches = batches.slice(1);

  const formatDate = (dateInput: any) => {
    if (!dateInput) return "N/A";
    try { return new Date(dateInput).toLocaleDateString(); } catch { return "N/A"; }
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
      {/* Main Row */}
      <tr 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group border-b border-slate-100 dark:border-slate-800 ${isExpanded ? "bg-slate-50 dark:bg-slate-800/30" : ""}`}
      >
        <td className="px-4 py-3 align-top" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {previousBatches.length > 0 ? (
              isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
            ) : <div className="w-4" />}
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
          </div>
        </td>
        <td className="px-4 py-3 align-top font-medium text-slate-900 dark:text-slate-100">
          {drug.name}
        </td>
        <td className="px-4 py-3 align-top">
          {drug.category ? (
            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
              {drug.category}
            </span>
          ) : <span className="text-slate-400">-</span>}
        </td>
        <td className="px-4 py-3 align-top font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {(drug.price / 100).toFixed(2)} ETB
        </td>

        <td className="px-4 py-3 align-top whitespace-nowrap">
          {totalStock > 0 ? (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{totalStock}</span>
          ) : (
            <span className="text-red-500 font-medium text-xs">Out of Stock</span>
          )}
        </td>
        <td className="px-4 py-3 align-top whitespace-nowrap font-mono text-xs">
          {latestBatch ? latestBatch.batchNumber : <span className="text-slate-400">N/A</span>}
        </td>
        <td className="px-4 py-3 align-top whitespace-nowrap text-xs text-slate-500">
          {latestBatch ? formatDate(latestBatch.expiryDate) : <span className="text-slate-400">N/A</span>}
        </td>
        <td className="px-4 py-3 align-top whitespace-nowrap text-xs text-slate-500">
          {latestBatch ? formatDate(latestBatch.dateAddedToStock) : <span className="text-slate-400">N/A</span>}
        </td>
        <td className="px-4 py-3 align-top whitespace-nowrap text-xs text-slate-500">
          {latestBatch && latestBatch.docNo ? latestBatch.docNo : <span className="text-slate-400">-</span>}
        </td>

        <td className="px-4 py-3 align-top text-xs text-slate-500 max-w-[150px] truncate" title={drug.description || ""}>
          {drug.description || <span className="text-slate-400">-</span>}
        </td>
        <td className="px-4 py-3 align-top text-right print:hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => { setIsAddingStock(!isAddingStock); setIsExpanded(true); }} className="text-slate-400 hover:text-green-600" title="Add Stock">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-blue-600" title="Edit Drug">
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={async () => {
                if(confirm("Are you sure you want to remove this drug?")) {
                  const { deleteDrug } = await import("../actions");
                  const res = await deleteDrug({ id: drug.id });
                  if (res?.error) toast.error(res.error);
                  else toast.success("Drug removed successfully.");
                }
              }} 
              className="text-slate-400 hover:text-red-600" title="Remove"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Add Stock Form */}
      {isAddingStock && (
        <tr className="bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
          <td colSpan={11} className="px-6 py-4">
            <form onSubmit={handleAddStock} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm max-w-3xl">
              <h4 className="text-sm font-bold mb-3 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                <Package className="w-4 h-4" /> Receive New Stock for {drug.name}
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
                <button type="button" onClick={() => setIsAddingStock(false)} className="px-4 py-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-md font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex justify-center items-center py-1.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Batch"}
                </button>
              </div>
            </form>
          </td>
        </tr>
      )}

      {/* History Rows */}
      {isExpanded && previousBatches.map((batch, idx) => (
        <tr key={batch.id} className="bg-slate-50/40 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800 text-slate-500">
          <td colSpan={4} className="px-4 py-2 border-r border-slate-100 dark:border-slate-800/50">
            {idx === 0 && <span className="text-xs italic pl-6 text-slate-400 flex items-center gap-1"><Package className="w-3 h-3"/> Previous Stock History</span>}
          </td>
          <td className="px-4 py-2 whitespace-nowrap font-medium text-slate-600 dark:text-slate-400">
            {batch.quantity}
          </td>
          <td className="px-4 py-2 whitespace-nowrap font-mono text-xs">
            {batch.batchNumber}
          </td>
          <td className="px-4 py-2 whitespace-nowrap text-xs">
            {formatDate(batch.expiryDate)}
          </td>
          <td className="px-4 py-2 whitespace-nowrap text-xs">
            {formatDate(batch.dateAddedToStock)}
          </td>
          <td className="px-4 py-2 whitespace-nowrap text-xs">
            {batch.docNo || "-"}
          </td>
          <td colSpan={2}></td>
        </tr>
      ))}
    </Fragment>
  );
}
