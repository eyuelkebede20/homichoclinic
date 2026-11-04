"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createDrug, createLabTest, receiveBatchForDrug, searchDrugsForIntake } from "../actions";
import { 
  Loader2, 
  Package, 
  Plus, 
  Search, 
  Pill, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Tag, 
  Layers, 
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { EthiopianDatePicker } from "@/components/ethiopian-date-picker";

export type IntakeDrug = {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  price: number; // in cents
  stock: number;
  description?: string | null;
  latestBatchNumber?: string | null;
  latestExpiryDate?: string | null;
};

export function CatalogForm({ 
  type, 
  collapsible = false,
  initialDrugs = [],
}: { 
  type: "drug" | "labTest"; 
  collapsible?: boolean;
  initialDrugs?: IntakeDrug[];
}) {
  const [isOpen, setIsOpen] = useState(!collapsible);
  const [loading, setLoading] = useState(false);

  // Pharmacy / Drug Intake States
  const [drugMode, setDrugMode] = useState<"search" | "new_drug">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [drugsList, setDrugsList] = useState<IntakeDrug[]>(initialDrugs);
  const [selectedDrug, setSelectedDrug] = useState<IntakeDrug | null>(null);

  // Controlled fields for selected drug editing
  const [editPrice, setEditPrice] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // New drug input name
  const [newDrugName, setNewDrugName] = useState("");

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync initialDrugs if they change
  useEffect(() => {
    if (initialDrugs && initialDrugs.length > 0) {
      setDrugsList(initialDrugs);
    }
  }, [initialDrugs]);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter drugs based on search query
  const filteredDrugs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return drugsList.slice(0, 15);
    return drugsList.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.category && d.category.toLowerCase().includes(q)) ||
        (d.unit && d.unit.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [drugsList, searchQuery]);

  // When a drug is selected from search
  function handleSelectDrug(drug: IntakeDrug) {
    setSelectedDrug(drug);
    setEditPrice((drug.price / 100).toFixed(2));
    setEditCategory(drug.category || "");
    setEditUnit(drug.unit || "");
    setEditDesc(drug.description || "");
    setIsSearchOpen(false);
    setSearchQuery("");
  }

  // Clear selection to search another drug
  function handleClearSelection() {
    setSelectedDrug(null);
    setEditPrice("");
    setEditCategory("");
    setEditUnit("");
    setEditDesc("");
    setIsSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  // Switch to Add New Medicine mode (e.g. from popup button or tab)
  function handleSwitchToNewDrug(prefillName?: string) {
    setDrugMode("new_drug");
    setIsSearchOpen(false);
    setSelectedDrug(null);
    setNewDrugName(prefillName !== undefined ? prefillName : searchQuery.trim());
  }

  // Switch back to search mode
  function handleSwitchToSearch() {
    setDrugMode("search");
    setIsSearchOpen(false);
    setSelectedDrug(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const formElement = e.currentTarget;

    if (type === "labTest") {
      const priceDollars = parseFloat(formData.get("price") as string);
      const unitVal = (formData.get("unit") as string)?.trim();
      const data = {
        name: (formData.get("name") as string)?.trim(),
        description: (formData.get("description") as string)?.trim() || undefined,
        price: Math.round(priceDollars * 100),
        unit: unitVal || undefined,
        options: (formData.get("options") as string)?.trim() || undefined,
      };

      const res = await createLabTest(data as any);
      setLoading(false);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Test added to catalog!");
        formElement.reset();
      }
      return;
    }

    // TYPE === "DRUG"
    if (drugMode === "search") {
      // Must have selected an existing drug
      if (!selectedDrug) {
        setLoading(false);
        toast.error("Please search and select a medication, or click '+ Add New Medicine'.");
        return;
      }

      const batchNumber = (formData.get("batchNumber") as string)?.trim();
      const quantityStr = (formData.get("quantity") as string)?.trim();
      const expiryDate = (formData.get("expiryDate") as string)?.trim();
      const dateAddedToStock = (formData.get("dateAddedToStock") as string)?.trim();
      const docNo = (formData.get("docNo") as string)?.trim();
      const priceVal = parseFloat(formData.get("price") as string);
      const categoryVal = (formData.get("category") as string)?.trim();
      const unitVal = (formData.get("unit") as string)?.trim();
      const descVal = (formData.get("description") as string)?.trim();

      if (!batchNumber) {
        setLoading(false);
        toast.error("Batch number is required to receive stock.");
        return;
      }

      const qty = parseInt(quantityStr, 10);
      if (isNaN(qty) || qty <= 0) {
        setLoading(false);
        toast.error("Please enter a valid stock quantity greater than 0.");
        return;
      }

      if (!expiryDate) {
        setLoading(false);
        toast.error("Expiry date is required for batch receiving.");
        return;
      }

      const res = await receiveBatchForDrug({
        drugId: selectedDrug.id,
        batchNumber,
        quantity: qty,
        expiryDate,
        price: !isNaN(priceVal) ? Math.round(priceVal * 100) : selectedDrug.price,
        dateAddedToStock: dateAddedToStock || undefined,
        docNo: docNo || undefined,
        category: categoryVal || undefined,
        unit: unitVal || undefined,
        description: descVal || undefined,
      });

      setLoading(false);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(res?.success || `Batch ${batchNumber} added successfully to ${selectedDrug.name}!`);
        // Update local drug stock
        setDrugsList((prev) =>
          prev.map((d) =>
            d.id === selectedDrug.id
              ? {
                  ...d,
                  stock: d.stock + qty,
                  price: !isNaN(priceVal) ? Math.round(priceVal * 100) : d.price,
                  category: categoryVal || d.category,
                  unit: unitVal || d.unit,
                }
              : d
          )
        );
        // Clear batch fields
        const batchInput = formElement.querySelector('input[name="batchNumber"]') as HTMLInputElement;
        const qtyInput = formElement.querySelector('input[name="quantity"]') as HTMLInputElement;
        const docInput = formElement.querySelector('input[name="docNo"]') as HTMLInputElement;
        if (batchInput) batchInput.value = "";
        if (qtyInput) qtyInput.value = "";
        if (docInput) docInput.value = "";
      }
    } else {
      // DRUG MODE === "new_drug"
      const priceDollars = parseFloat(formData.get("price") as string);
      const unitVal = (formData.get("unit") as string)?.trim();
      const categoryVal = (formData.get("category") as string)?.trim();
      const initialStockStr = (formData.get("initialStock") as string)?.trim();
      const batchNumberVal = (formData.get("batchNumber") as string)?.trim();
      const expiryDateVal = (formData.get("expiryDate") as string)?.trim();
      const dateAddedVal = (formData.get("dateAddedToStock") as string)?.trim();
      const docNoVal = (formData.get("docNo") as string)?.trim();
      const drugName = (formData.get("name") as string)?.trim();

      if (!drugName) {
        setLoading(false);
        toast.error("Medication name is required.");
        return;
      }

      const data: Record<string, any> = {
        name: drugName,
        description: (formData.get("description") as string)?.trim() || undefined,
        price: Math.round((priceDollars || 0) * 100),
        category: categoryVal || undefined,
        unit: unitVal || undefined,
      };

      if (initialStockStr && initialStockStr !== "") {
        const parsed = parseInt(initialStockStr, 10);
        if (!isNaN(parsed)) data.initialStock = parsed;
      }
      if (batchNumberVal) data.batchNumber = batchNumberVal;
      if (expiryDateVal) data.expiryDate = expiryDateVal;
      if (dateAddedVal) data.dateAddedToStock = dateAddedVal;
      if (docNoVal) data.docNo = docNoVal;

      const res = await createDrug(data as any);
      setLoading(false);

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("New medication registered with initial stock & batch!");
        formElement.reset();
        setNewDrugName("");
        // Add to local drugs list
        if ((res as any)?.id) {
          const newEntry: IntakeDrug = {
            id: (res as any).id,
            name: drugName,
            category: categoryVal || null,
            unit: unitVal || null,
            price: Math.round((priceDollars || 0) * 100),
            stock: data.initialStock || 0,
            description: data.description,
            latestBatchNumber: batchNumberVal || null,
          };
          setDrugsList((prev) => [newEntry, ...prev]);
        }
        // Switch back to search mode with this new drug or ready to search
        setDrugMode("search");
      }
    }
  }

  if (collapsible && !isOpen) {
    return (
      <div className="bg-white dark:bg-slate-900 p-4 shadow-sm rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {type === "drug" ? "Add Batch or Register Medication" : "Register New Lab Test"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {type === "drug" 
                  ? "Search existing drug to intake new batch, or register new medication" 
                  : "Add custom lab test, measuring unit, price & result options"}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800">
            + Expand Form
          </span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-5 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {type === "drug" ? (
                drugMode === "search" ? "Add New Batch / Stock Intake (አዲስ ባች መቀበያ)" : "Register New Medication (አዲስ መድኃኒት መመዝገቢያ)"
              ) : (
                "Register New Lab Test"
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {type === "drug"
                ? drugMode === "search"
                  ? "Search existing medicine to add a new stock batch or update pricing"
                  : "Register a brand new medicine definition and initial batch"
                : "Catalog service definition and testing options"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {type === "drug" && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={handleSwitchToSearch}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  drugMode === "search"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Search Medicine
              </button>
              <button
                type="button"
                onClick={() => handleSwitchToNewDrug()}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  drugMode === "new_drug"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                + Add New Medicine
              </button>
            </div>
          )}

          {collapsible && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hide Form
            </button>
          )}
        </div>
      </div>

      {/* DRUG MODE: SEARCH TAB & POPUP DROPDOWN */}
      {type === "drug" && drugMode === "search" && (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Search Medicine to Receive Batch / መድኃኒት ይፈልጉ *
          </label>

          {/* If a drug is already selected, display the Selected Medicine Card */}
          {selectedDrug ? (
            <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {selectedDrug.name}
                    </h4>
                    {selectedDrug.category && (
                      <span className="text-[11px] font-medium bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        {selectedDrug.category}
                      </span>
                    )}
                    {selectedDrug.unit && (
                      <span className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                        Unit: {selectedDrug.unit}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1">
                    <span>
                      Current Stock:{" "}
                      <strong className={selectedDrug.stock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}>
                        {selectedDrug.stock} available
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Current Price: <strong>ETB {(selectedDrug.price / 100).toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearSelection}
                className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
                Change Medicine / ሌላ መድኃኒት ምረጥ
              </button>
            </div>
          ) : (
            /* Search Input Bar with Popup Dropdown */
            <div ref={searchContainerRef} className="relative">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!isSearchOpen) setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Type to search medicine name, category, or form... (e.g. Paracetamol, Amoxicillin)"
                  className="w-full pl-10 pr-24 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        searchInputRef.current?.focus();
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    Catalog
                  </span>
                </div>
              </div>

              {/* POPUP DROPDOWN (under search bar) */}
              {isSearchOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* Results List */}
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDrugs.length > 0 ? (
                      filteredDrugs.map((drug) => (
                        <div
                          key={drug.id}
                          onClick={() => handleSelectDrug(drug)}
                          className="p-3 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 cursor-pointer transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 group-hover:text-blue-600 transition-colors">
                              <Pill className="w-4 h-4" />
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                  {drug.name}
                                </span>
                                {drug.category && (
                                  <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                                    {drug.category}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                <span>Unit: {drug.unit || "N/A"}</span>
                                <span>•</span>
                                <span>ETB {(drug.price / 100).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                drug.stock > 0
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                              }`}
                            >
                              {drug.stock > 0 ? `${drug.stock} in stock` : "Out of stock"}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      /* NO SEARCH RESULTS POPUP EMPTY STATE */
                      <div className="p-6 text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            No medication found matching &quot;{searchQuery}&quot;
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            This medicine is not yet in your pharmacy catalog.
                          </p>
                        </div>

                        {/* EASY TO FIND + ADD NEW MEDICINE BUTTON AT THE BOTTOM OF EMPTY RESULTS */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleSwitchToNewDrug(searchQuery.trim())}
                            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                          >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            + Add &quot;{searchQuery || "New Medicine"}&quot; as New Medicine
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* POPUP FOOTER BUTTON: Always present under search results so pharmacist can easily add new */}
                  {filteredDrugs.length > 0 && (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        Can&apos;t find your medicine in this list?
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSwitchToNewDrug(searchQuery.trim())}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        + Add New Medicine
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DRUG MODE: REGISTER NEW MEDICINE TAB/VIEW */}
      {type === "drug" && drugMode === "new_drug" && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                Registering a brand new medication to the pharmacy catalog.
              </span>
            </div>
            <button
              type="button"
              onClick={handleSwitchToSearch}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Search & Add Batch
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Medication Name / የመድኃኒት ስም *
            </label>
            <input 
              required 
              name="name" 
              type="text" 
              value={newDrugName}
              onChange={(e) => setNewDrugName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              placeholder="e.g. Paracetamol 500mg, Amoxicillin 250mg/5ml" 
            />
          </div>
        </div>
      )}

      {/* LAB TEST NAME INPUT */}
      {type === "labTest" && (
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Test Name *
          </label>
          <input 
            required 
            name="name" 
            type="text" 
            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
            placeholder="e.g. Blood Grouping, Complete Blood Count" 
          />
        </div>
      )}

      {/* DETAILS GRID: CATEGORY, UNIT, SELLING PRICE, DESCRIPTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {type === "drug" && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Category / ምድብ</label>
              <input 
                name="category" 
                type="text" 
                value={drugMode === "search" ? editCategory : undefined}
                onChange={drugMode === "search" ? (e) => setEditCategory(e.target.value) : undefined}
                placeholder="e.g. Antibiotics, Analgesics" 
                className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Measuring Unit / መለኪያ</label>
              <input 
                name="unit" 
                type="text" 
                value={drugMode === "search" ? editUnit : undefined}
                onChange={drugMode === "search" ? (e) => setEditUnit(e.target.value) : undefined}
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
            value={drugMode === "search" ? editPrice : undefined}
            onChange={drugMode === "search" ? (e) => setEditPrice(e.target.value) : undefined}
            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
            placeholder="15.00" 
          />
        </div>

        <div className={type === "drug" ? "" : "sm:col-span-2"}>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Description / ማብራሪያ</label>
          <input 
            name="description" 
            type="text" 
            value={drugMode === "search" ? editDesc : undefined}
            onChange={drugMode === "search" ? (e) => setEditDesc(e.target.value) : undefined}
            placeholder="e.g. Oral syrup 100ml" 
            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
          />
        </div>
      </div>

      {/* BATCH & STOCK RECEIVING SECTION */}
      {type === "drug" && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              {drugMode === "search" 
                ? "Batch Intake & Stock Receiving (የባች ቁጥር እና ክምችት መቀበያ) *" 
                : "Batch & Initial Stock Receiving (የባች ቁጥር እና የመጀመሪያ ክምችት ማስገቢያ)"}
            </span>
            <span className="text-[11px] text-slate-500">
              {drugMode === "search" ? "Required for batch intake" : "Optional for new stock arrival"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Batch Number (የባች ቁጥር) {drugMode === "search" && "*"}
              </label>
              <input 
                name="batchNumber" 
                type="text" 
                required={drugMode === "search"}
                placeholder="e.g. BAT-2026-001" 
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2.5 py-1.5 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {drugMode === "search" ? "Received Quantity (ብዛት) *" : "Initial Stock / Quantity (ብዛት)"}
              </label>
              <input 
                name={drugMode === "search" ? "quantity" : "initialStock"} 
                type="number" 
                min={drugMode === "search" ? "1" : "0"} 
                required={drugMode === "search"}
                placeholder="e.g. 100" 
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Expiry Date (የሚያበቃበት ቀን) {drugMode === "search" && "*"}
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
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
          </div>
        </div>
      )}

      {/* LAB TEST OPTIONS */}
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

      {/* SUBMIT BUTTON */}
      <button 
        type="submit" 
        disabled={loading} 
        className="w-full py-2.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center transition-all"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : type === "drug" ? (
          drugMode === "search" ? (
            selectedDrug ? (
              `+ Receive Batch Stock for ${selectedDrug.name}`
            ) : (
              "+ Receive Batch Stock (Select Medicine Above)"
            )
          ) : (
            "+ Register New Medication & Receive Stock"
          )
        ) : (
          "Add to Catalog"
        )}
      </button>
    </form>
  );
}
