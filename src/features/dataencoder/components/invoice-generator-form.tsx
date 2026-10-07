"use client";

import { useState } from "react";
import { createInvoice } from "../actions";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { PatientSearchSelect } from "@/components/patient-search-select";
import { toast } from "sonner";

export function InvoiceGeneratorForm({ patients }: { 
  patients: { id: string; firstName: string; lastName: string; discountPercent: number }[] 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState("");
  
  const [items, setItems] = useState([
    { description: "General Consultation", quantity: 1, unitPriceStr: "50.00", isDiscountable: true }
  ]);

  const activePatient = patients.find(p => p.id === patientId);

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPriceStr: "0.00", isDiscountable: true }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleChange = (index: number, field: keyof typeof items[0], value: string | number | boolean) => {
    const newItems = [...items];
    (newItems[index][field] as any) = value;
    setItems(newItems);
  };

  // Preview Math
  let subtotal = 0;
  let discountable = 0;
  items.forEach(item => {
    const price = parseFloat(item.unitPriceStr) || 0;
    const lineTotal = price * item.quantity;
    subtotal += lineTotal;
    if (item.isDiscountable) discountable += lineTotal;
  });
  
  const discountPercent = activePatient?.discountPercent || 0;
  const discountAmount = (discountable * discountPercent) / 100;
  const total = subtotal - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      toast.success("Please select a patient.");
      return;
    }
    
    // Validate items
    const parsedItems = items.map(item => {
      const price = parseFloat(item.unitPriceStr);
      if (isNaN(price) || price < 0) throw new Error("Invalid price for item: " + item.description);
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: Math.round(price * 100), // minor units
        isDiscountable: item.isDiscountable
      };
    });

    setLoading(true);
    const res = await createInvoice({ patientId, items: parsedItems });
    setLoading(false);
    
    if (res.error) toast.error(res.error);
    else {
      router.push("/billing");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Patient</label>
        <PatientSearchSelect 
          patients={patients}
          selectedId={patientId}
          onChange={setPatientId}
        />
        
        {activePatient && (
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
            Active Discount: {activePatient.discountPercent}% (Only applies to discountable items)
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Line Items</h2>
          <button type="button" onClick={handleAddItem} className="text-sm flex items-center text-blue-600 hover:text-blue-800 font-medium">
            <Plus className="w-4 h-4 mr-1" /> Add Row
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex gap-4 items-end pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <input required type="text" value={item.description} onChange={(e) => handleChange(index, 'description', e.target.value)} placeholder="e.g. Lab Test: CBC" className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm" />
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Qty</label>
                <input required type="number" min="1" value={item.quantity} onChange={(e) => handleChange(index, 'quantity', parseInt(e.target.value))} className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm" />
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Unit Price (ETB)</label>
                <input required type="number" step="0.01" min="0" value={item.unitPriceStr} onChange={(e) => handleChange(index, 'unitPriceStr', e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm" />
              </div>
              <div className="w-24 text-center">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Discountable?</label>
                <input type="checkbox" checked={item.isDiscountable} onChange={(e) => handleChange(index, 'isDiscountable', e.target.checked)} className="w-4 h-4 mt-2 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              </div>
              <div className="w-10 flex justify-end pb-2">
                <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700" disabled={items.length === 1}>
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-950 p-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex justify-end text-sm space-y-2">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span>{subtotal.toFixed(2)} ETB</span>
              </div>
              <div className="flex justify-between text-blue-600 dark:text-blue-400 font-medium">
                <span>Discount ({discountPercent}%):</span>
                <span>-{discountAmount.toFixed(2)} ETB</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                <span>Total:</span>
                <span>{total.toFixed(2)} ETB</span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={loading} className="flex justify-center items-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Generate Invoice"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
