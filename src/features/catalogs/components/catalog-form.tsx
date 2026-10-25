"use client";

import { useState } from "react";
import { createDrug, createLabTest } from "../actions";
import { Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { EthiopianDatePicker } from "@/components/ethiopian-date-picker";

export function CatalogForm({ type }: { type: "drug" | "labTest" }) {
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const priceDollars = parseFloat(formData.get("price") as string);
    const unitVal = formData.get("unit") as string;
    const initialStockStr = formData.get("initialStock") as string;
    const batchNumberVal = formData.get("batchNumber") as string;
    const expiryDateVal = formData.get("expiryDate") as string;
    const dateAddedVal = formData.get("dateAddedToStock") as string;
    const docNoVal = formData.get("docNo") as string;

    const data: Record<string, any> = {
      name: (formData.get("name") as string)?.trim(),
      description: (formData.get("description") as string)?.trim() || undefined,
      price: Math.round(priceDollars * 100), // Convert to minor units
    };

    if (unitVal?.trim()) {
      data.unit = unitVal.trim();
    }

    if (type === "drug") {
      data.category = (formData.get("category") as string)?.trim() || undefined;
      if (initialStockStr && initialStockStr.trim() !== "") {
        const parsed = parseInt(initialStockStr.trim(), 10);
        if (!isNaN(parsed)) data.initialStock = parsed;
      }
      if (batchNumberVal?.trim()) data.batchNumber = batchNumberVal.trim();
      if (expiryDateVal?.trim()) data.expiryDate = expiryDateVal.trim();
      if (dateAddedVal?.trim()) data.dateAddedToStock = dateAddedVal.trim();
      if (docNoVal?.trim()) data.docNo = docNoVal.trim();
    } else {
      data.options = formData.get("options") as string;
    }

    const res = type === "drug" ? await createDrug(data as any) : await createLabTest(data as any);
    
    setLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else if ((res as {success?: string})?.success) {
      toast.success((res as {success?: string}).success);
      (e.target as HTMLFormElement).reset();
    } else {
      toast.success(type === "drug" ? "New medication added with batch & stock!" : "Test added to catalog!");
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-5 shadow rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          {type === "drug" ? "Register New Medication" : "Register New Lab Test"}
        </h3>
        <span className="text-xs text-slate-400">
          {type === "drug" ? "Includes price, batch & initial stock" : "Catalog service definition"}
        </span>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          {type === "drug" ? "Medication Name / የመድኃኒት ስም *" : "Test Name *"}
        </label>
        <input 
          required 
          name="name" 
          type="text" 
          className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
          placeholder={type === "drug" ? "e.g. Paracetamol 500mg, Amoxicillin 250mg/5ml" : "e.g. Blood Grouping, Complete Blood Count"} 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {type === "drug" && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Category / ምድብ</label>
              <input 
                name="category" 
                type="text" 
                placeholder="e.g. Antibiotics, Analgesics" 
                className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Measuring Unit / መለኪያ</label>
              <input 
                name="unit" 
                type="text" 
                placeholder="e.g. Tab, Vial, Box, Bottle, Ampoule" 
                className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
          </>
        )}

        {type === "labTest" && (
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Measuring Unit</label>
            <input 
              name="unit" 
              type="text" 
              placeholder="e.g. mg/dL, %, cells/uL" 
              className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm" 
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Selling Price (ETB) *</label>
          <input 
            required 
            name="price" 
            type="number" 
            step="0.01" 
            min="0" 
            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
            placeholder="15.00" 
          />
        </div>

        <div className={type === "drug" ? "" : "sm:col-span-2"}>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Description / ማብራሪያ</label>
          <input 
            name="description" 
            type="text" 
            placeholder="e.g. Oral syrup 100ml" 
            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
          />
        </div>
      </div>

      {type === "drug" && (
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Batch & Initial Stock Receiving (የባች ቁጥር እና የመጀመሪያ ክምችት ማስገቢያ)
            </span>
            <span className="text-[11px] text-slate-500">Optional for new stock arrival</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Batch Number (የባች ቁጥር)
              </label>
              <input 
                name="batchNumber" 
                type="text" 
                placeholder="e.g. BAT-2026-001" 
                className="block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2.5 py-1.5 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Initial Stock / Quantity (ብዛት)
              </label>
              <input 
                name="initialStock" 
                type="number" 
                min="0" 
                placeholder="e.g. 100" 
                className="block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Expiry Date (የሚያበቃበት ቀን)
              </label>
              <EthiopianDatePicker 
                name="expiryDate" 
                placeholder="የሚያበቃበት ቀን ይምረጡ" 
                mode="gregorian-iso" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Date Added (የገባበት ቀን)
              </label>
              <EthiopianDatePicker 
                name="dateAddedToStock" 
                placeholder="የገባበት ቀን ይምረጡ" 
                mode="gregorian-iso" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Doc / Invoice No (የሰነድ ቁጥር)
              </label>
              <input 
                name="docNo" 
                type="text" 
                placeholder="e.g. INV-1002" 
                className="block w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
          </div>
        </div>
      )}

      {type === "labTest" && (
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Result Options (comma-separated)
          </label>
          <input 
            name="options" 
            type="text" 
            placeholder="e.g. Positive, Negative, Inconclusive or A+, A-, B+, B-, O+, O-" 
            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
          />
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (type === "drug" ? "Add Medication to Catalog & Receive Stock" : "Add to Catalog")}
      </button>
    </form>
  );
}
