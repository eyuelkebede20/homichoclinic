"use client";

import { useState } from "react";
import { createDrug, createLabTest } from "../actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CatalogForm({ type }: { type: "drug" | "labTest" }) {
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const priceDollars = parseFloat(formData.get("price") as string);
    const data: Record<string, string | number> = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: Math.round(priceDollars * 100), // Convert to minor units
    };

    if (type === "drug") {
      data.category = formData.get("category") as string;
    }

    const res = type === "drug" ? await createDrug(data as any) : await createLabTest(data as any);
    
    setLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else if ((res as {success?: string})?.success) {
      toast.success((res as {success?: string}).success);
      (e.target as HTMLFormElement).reset();
    } else {
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-4 shadow rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Name</label>
        <input required name="name" type="text" className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm" placeholder="e.g. Paracetamol 500mg" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Description</label>
          <input name="description" type="text" className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm" />
        </div>
        {type === "drug" && (
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Category</label>
            <input name="category" type="text" placeholder="e.g. Antibiotics" className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm" />
          </div>
        )}
        <div className="w-24">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Price (ETB)</label>
          <input required name="price" type="number" step="0.01" min="0" className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm" placeholder="10.00" />
        </div>
      </div>
      <button type="submit" disabled={loading} className="w-full mt-2 flex justify-center items-center py-1.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Add to Catalog"}
      </button>
    </form>
  );
}
