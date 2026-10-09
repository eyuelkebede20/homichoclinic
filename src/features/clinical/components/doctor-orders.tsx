"use client";

import { useState } from "react";
import { requestLabTest, createPrescription, saveReferral } from "../actions";
import { Loader2, FlaskConical, Droplet, Activity, AlertTriangle, CheckCircle, Send, X, Printer } from "lucide-react";
import { toast } from "sonner";
import { isStoolTest, isUrineTest, isHematologyTest } from "../types/lab-panels";

export function DoctorOrders({ 
  patient, 
  labTests, 
  drugs,
  referralDestinations = [],
  clinicNames
}: { 
  patient: any;
  labTests: { id: string; name: string }[];
  drugs: { id: string; name: string }[];
  referralDestinations?: string[];
  clinicNames?: { clinicName: string; clinicNameAmharic: string; clinicSubName: string; clinicSubNameAmharic: string; clinicLogo?: string };
}) {
  const patientId = patient.id;
  const [loading, setLoading] = useState(false);
  const [rxItems, setRxItems] = useState([{ drugId: "", search: "", quantity: 1, instructions: "" }]);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [isUrgent, setIsUrgent] = useState(false);

  const [refType, setRefType] = useState("Standard Referral");
  const [refDest, setRefDest] = useState("");
  const [refReason, setRefReason] = useState("");

  // Identify the 3 core default tests from the catalog or fallback
  const stoolTest = labTests.find(t => isStoolTest(t.name));
  const urineTest = labTests.find(t => isUrineTest(t.name));
  const hematologyTest = labTests.find(t => isHematologyTest(t.name));

  const coreIds = new Set([stoolTest?.id, urineTest?.id, hematologyTest?.id].filter(Boolean));
  const otherTests = labTests.filter(t => !coreIds.has(t.id));

  async function handleLabSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedTests.size === 0) {
      toast.error("Please select at least one test.");
      return;
    }
    
    setLoading(true);
    
    const res = await requestLabTest({
      patientId,
      testIds: Array.from(selectedTests),
      isUrgent,
    });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success(isUrgent ? "URGENT lab order sent to laboratory!" : "Lab tests requested successfully.");
      setSelectedTests(new Set());
      setIsUrgent(false);
    }
  }

  function toggleTest(id: string) {
    const next = new Set(selectedTests);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTests(next);
  }

  async function handleRxSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    // Filter empty rows that the user hasn't typed anything in
    const filledItems = rxItems.filter(i => i.search || i.drugId || i.instructions);
    
    // Check if any filled item is invalid
    const invalidItems = filledItems.filter(i => !i.drugId || i.quantity <= 0 || !i.instructions.trim());
    
    if (filledItems.length === 0) {
      toast.success("Please complete at least one prescription item.");
      setLoading(false);
      return;
    }
    
    if (invalidItems.length > 0) {
      toast.error("One or more prescription items are invalid (e.g. out of stock or missing dosage). Please fix or remove them.");
      setLoading(false);
      return;
    }

    const res = await createPrescription({ patientId, items: filledItems as any });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Prescription sent to pharmacy.");
      setRxItems([{ drugId: "", search: "", quantity: 1, instructions: "" }]);
    }
  }

  async function handleReferralSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!refDest.trim() || !refReason.trim()) {
      toast.error("Destination and Reason are required.");
      return;
    }
    setLoading(true);
    const res = await saveReferral({
      patientId,
      type: refType,
      destination: refDest,
      reason: refReason
    });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Referral created successfully.");
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Referral Sheet – Homicho Ammunation Engineering Industry Health Center</title>
<style>
  :root {
    --ink: #111;
    --paper: #ffffff;
    --desk: #e9eef0;
    --rule: #222;
    --hint: #8a9399;
    --focus: #1a56c4;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body {
    background: var(--desk);
    color: var(--ink);
    font-family: "Times New Roman", Times, "Liberation Serif", serif;
    font-size: 16px;
    line-height: 1.3;
    padding: 24px 12px 48px;
  }

.sheet {
max-width: 800px;
margin: 0 auto;
background: var(--paper);
padding: 40px 48px 44px;
box-shadow: 0 1px 6px rgba(0,0,0,.18);
}

.header { text-align: center; margin-bottom: 18px; }
.header .am { font-size: 17px; font-weight: 700; line-height: 1.35; }
.header .en { font-size: 17px; font-weight: 700; letter-spacing: .01em; line-height: 1.35; }
.header .am + .en { margin-top: 6px; }
.title {
display: inline-block;
margin: 22px 0 0;
font-size: 30px;
font-weight: 700;
letter-spacing: .04em;
border-bottom: 3px solid var(--ink);
padding-bottom: 1px;
}

form { margin-top: 26px; }
.row { display: flex; gap: 22px; align-items: flex-end; margin-bottom: 20px; }
.field { display: flex; align-items: flex-end; gap: 8px; flex: 1 1 0; min-width: 0; }
.field.wide { flex: 2 1 0; }
.field.narrow { flex: .6 1 0; }
label { font-weight: 700; white-space: nowrap; font-size: 15px; letter-spacing: .02em; }
input[type="text"], input[type="number"], input[type="date"], select {
flex: 1;
min-width: 0;
font: inherit;
font-size: 16px;
color: var(--ink);
background: transparent;
border: 0;
border-bottom: 1.5px solid var(--rule);
border-radius: 0;
padding: 2px 4px;
outline: none;
appearance: none;
-webkit-appearance: none;
}
select { background: transparent; }

input:focus, textarea:focus, select:focus {
border-bottom-color: var(--focus);
box-shadow: 0 2px 0 0 var(--focus);
}

.block { margin-bottom: 22px; }
.block > label { display: block; margin-bottom: 2px; }
textarea {
display: block;
width: 100%;
font: inherit;
font-size: 16px;
color: var(--ink);
background-image: repeating-linear-gradient(
to bottom,
transparent 0, transparent 31px,
var(--rule) 31px, var(--rule) 32px
);
background-attachment: local;
border: 0;
line-height: 32px;
padding: 0 4px;
resize: vertical;
outline: none;
overflow: hidden;
}
textarea.l2 { height: 64px; }
textarea.l3 { height: 96px; }
textarea.l4 { height: 128px; }

.signoff { margin-top: 30px; }

.actions {
max-width: 800px;
margin: 16px auto 0;
display: flex;
gap: 10px;
justify-content: flex-end;
}
button {
font: inherit;
font-size: 15px;
padding: 9px 18px;
border: 1.5px solid var(--ink);
background: var(--paper);
color: var(--ink);
cursor: pointer;
}
button.primary { background: var(--ink); color: #fff; }
button:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

::placeholder { color: var(--hint); opacity: 1; font-size: 14px; font-style: italic; }

@media (max-width: 640px) {
.sheet { padding: 26px 18px 30px; }
.row { flex-direction: column; align-items: stretch; gap: 16px; }
.title { font-size: 25px; }
.header .am, .header .en { font-size: 15px; }
}

@media print {
@page { size: A4; margin: 14mm; }
body { background: #fff; padding: 0; }
.sheet { box-shadow: none; padding: 0; max-width: none; }
.actions { display: none; }
::placeholder { color: transparent; }
input, textarea, select { border-color: #000; }
select { background: none; }
}
</style>

</head>
<body>

<main class="sheet">
  <header class="header">
    <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
      \${clinicNames?.clinicLogo ? \`<img src="\${clinicNames.clinicLogo}" style="max-width: 80px; max-height: 80px; object-fit: contain;" />\` : ''}
      <div>
        <div class="am">\${clinicNames?.clinicNameAmharic || "የመከላከያ ኢንጂነሪንግ ኢንዱስትሪ ኮርፖሬሽን"}</div>
        <div class="am">\${clinicNames?.clinicSubNameAmharic || "ሆሚቾ አሙኒሽን ኢንጂነሪንግ ኢንዱስትሪ ጤና ጣቢያ"}</div>
        <div class="en">\${clinicNames?.clinicName || "DEFENCE ENGINEERING INDUSTRIES GROUP"}</div>
        <div class="en">\${clinicNames?.clinicSubName || "HOMICHO AMMUNATION ENGINEERING INDUSTRY HEALTH CENTER"}</div>
      </div>
    </div>
    <h1 class="title">REFERAL SHEET</h1>
  </header>

  <form id="referral" autocomplete="off">
    <div class="row">
      <div class="field wide">
        <label for="name">NAME</label>
        <input type="text" id="name" name="name" placeholder="Full name of patient" value="\${patient.firstName} \${patient.lastName}">
      </div>
      <div class="field narrow">
        <label for="age">AGE</label>
        <input type="number" id="age" name="age" min="0" max="120" placeholder="Years" value="\${patient.yob ? new Date().getFullYear() - parseInt(patient.yob, 10) : ''}">
      </div>
      <div class="field narrow">
        <label for="sex">SEX</label>
        <select id="sex" name="sex">
          <option value="">Select</option>
          <option \${patient.gender?.toLowerCase() === 'male' ? 'selected' : ''}>Male</option>
          <option \${patient.gender?.toLowerCase() === 'female' ? 'selected' : ''}>Female</option>
        </select>
      </div>
    </div>

    <div class="row">
      <div class="field wide">
        <label for="unit">UNIT</label>
        <input type="text" id="unit" name="unit" placeholder="Department or unit" value="\${patient.department || ''}">
      </div>
      <div class="field">
        <label for="rank">RANK</label>
        <input type="text" id="rank" name="rank" placeholder="Rank or position" value="\${patient.rank || ''}">
      </div>
    </div>

    <div class="row">
      <div class="field">
        <label for="from">REFERRED FROM</label>
        <input type="text" id="from" name="referred_from" placeholder="Facility or clinician" value="\${clinicNames?.clinicSubName || "Homicho Clinic"}">
      </div>
      <div class="field">
        <label for="to">REFERRED TO</label>
        <input type="text" id="to" name="referred_to" placeholder="Facility or specialist" value="\${refDest}">
      </div>
    </div>

    <div class="block">
      <label for="history">BRIEF HISTORY AND PHYSICAL FINDINGS</label>
      <textarea id="history" name="history_physical" class="l4" placeholder="Presenting complaint, history, examination findings">\${refReason}</textarea>
    </div>

    <div class="block">
      <label for="lab">LAB AND X-RAY FINDINGS</label>
      <textarea id="lab" name="lab_xray" class="l3" placeholder="Laboratory and imaging results"></textarea>
    </div>

    <div class="block">
      <label for="diagnosis">DIAGNOSIS</label>
      <textarea id="diagnosis" name="diagnosis" class="l3" placeholder="Working or confirmed diagnosis"></textarea>
    </div>

    <div class="block">
      <label for="treatment">TREATMENT GIVEN</label>
      <textarea id="treatment" name="treatment" class="l3" placeholder="Drugs, doses and procedures given"></textarea>
    </div>

    <div class="block">
      <label for="recommendation">RECOMMENDATION</label>
      <textarea id="recommendation" name="recommendation" class="l3" placeholder="Reason for referral and care requested"></textarea>
    </div>

    <div class="row signoff">
      <div class="field wide">
        <label for="dr">Dr.</label>
        <input type="text" id="dr" name="doctor" placeholder="Referring doctor's name and signature">
      </div>
      <div class="field">
        <label for="date">Date</label>
        <input type="date" id="date" name="date">
      </div>
    </div>

  </form>
</main>

<div class="actions">
  <button type="button" id="clear">Clear form</button>
  <button type="button" class="primary" id="print">Print</button>
</div>

<script>
  document.getElementById('print').addEventListener('click', function () { window.print(); });
  document.getElementById('clear').addEventListener('click', function () {
    document.getElementById('referral').reset();
  });
  // Default the date to today; the person can change it.
  var d = document.getElementById('date');
  var t = new Date();
  if(!d.value) {
    d.value = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  }
</script>
</body>
</html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }

      setRefDest("");
      setRefReason("");
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Lab Request Form */}
      <div id="lab-request" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 scroll-mt-24 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Request Laboratory Tests
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Order routine panels and specialized laboratory investigations</p>
          </div>

          {/* Urgent / STAT Toggle */}
          <button
            type="button"
            onClick={() => setIsUrgent(!isUrgent)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              isUrgent
                ? "bg-red-600 text-white border-red-700 shadow-md animate-pulse ring-2 ring-red-400/50"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${isUrgent ? "text-white" : "text-amber-500"}`} />
            {isUrgent ? "⚡ MARKED AS URGENT (STAT)" : "Mark Order as Urgent"}
          </button>
        </div>

        <form onSubmit={handleLabSubmit} className="space-y-5">
          {/* Top 3 Core Special Tests */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Core Diagnostic Panels (Default & Routine)
              </h4>
              <span className="text-[11px] text-slate-400 italic">Click to select/unselect</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Stool Examination - Green */}
              {stoolTest ? (
                <button
                  type="button"
                  onClick={() => toggleTest(stoolTest.id)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all ${
                    selectedTests.has(stoolTest.id)
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-md scale-[1.01]"
                      : "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200 hover:border-emerald-400"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${selectedTests.has(stoolTest.id) ? "bg-white/20 text-white" : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"}`}>
                        <FlaskConical className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm">Stool Examination</span>
                    </div>
                    {selectedTests.has(stoolTest.id) && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <p className={`text-[11px] mt-1 line-clamp-2 ${selectedTests.has(stoolTest.id) ? "text-emerald-100" : "text-slate-500 dark:text-slate-400"}`}>
                    Macroscopic, occult blood, pus/mucus & microscopic ova/parasite
                  </p>
                </button>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  Stool Examination (Available in general list)
                </div>
              )}

              {/* 2. Urine Examination - Yellow/Amber */}
              {urineTest ? (
                <button
                  type="button"
                  onClick={() => toggleTest(urineTest.id)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all ${
                    selectedTests.has(urineTest.id)
                      ? "bg-amber-500 text-white border-amber-600 shadow-md scale-[1.01]"
                      : "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200 hover:border-amber-400"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${selectedTests.has(urineTest.id) ? "bg-white/20 text-white" : "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300"}`}>
                        <Droplet className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm">Urine Examination</span>
                    </div>
                    {selectedTests.has(urineTest.id) && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <p className={`text-[11px] mt-1 line-clamp-2 ${selectedTests.has(urineTest.id) ? "text-amber-100" : "text-slate-500 dark:text-slate-400"}`}>
                    Physical, chemical dipstick (Albumin/Sugar/Ketones) & sediment
                  </p>
                </button>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-amber-300 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  Urine Examination (Available in general list)
                </div>
              )}

              {/* 3. Hematology - Blood-Red */}
              {hematologyTest ? (
                <button
                  type="button"
                  onClick={() => toggleTest(hematologyTest.id)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all ${
                    selectedTests.has(hematologyTest.id)
                      ? "bg-rose-700 text-white border-rose-800 shadow-md scale-[1.01]"
                      : "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-200 hover:border-rose-400"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${selectedTests.has(hematologyTest.id) ? "bg-white/20 text-white" : "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300"}`}>
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm">Hematology / CBC</span>
                    </div>
                    {selectedTests.has(hematologyTest.id) && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <p className={`text-[11px] mt-1 line-clamp-2 ${selectedTests.has(hematologyTest.id) ? "text-rose-100" : "text-slate-500 dark:text-slate-400"}`}>
                    WBC & diff %, RBC, Hgb, Hct, platelets, coagulation & ESR
                  </p>
                </button>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 flex items-center justify-center">
                  Hematology (Available in general list)
                </div>
              )}
            </div>
          </div>

          {/* Other Laboratory Tests */}
          {otherTests.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Additional Tests & Serology Catalog
              </h4>
              <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/70 dark:bg-slate-950/50 flex flex-wrap gap-2">
                {otherTests.map(t => {
                  const isSelected = selectedTests.has(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => toggleTest(t.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 ${
                        isSelected 
                          ? "bg-indigo-600 border-indigo-700 text-white shadow-sm" 
                          : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500">
              {selectedTests.size === 0 ? (
                <span>No tests currently selected.</span>
              ) : (
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedTests.size} test(s) selected {isUrgent && <span className="text-red-600 font-bold ml-1">(STAT / Urgent)</span>}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || selectedTests.size === 0}
              className={`py-2 px-6 rounded-xl shadow-sm text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center gap-2 ${
                isUrgent ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Send {selectedTests.size > 0 ? selectedTests.size : ""} Test(s) to Lab
            </button>
          </div>
        </form>
      </div>

      {/* Prescription Form */}
      <div id="prescription" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 scroll-mt-24">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          Write Prescription
        </h3>
        <form onSubmit={handleRxSubmit} className="space-y-4">
          
          {rxItems.map((item, index) => (
            <div key={index} className="flex gap-4 items-start border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Search Drug</label>
                <input 
                  type="text"
                  placeholder="Type to search..."
                  value={item.search || ""}
                  onChange={e => {
                    const newItems = [...rxItems];
                    newItems[index].search = e.target.value;
                    const match = drugs.find(d => d.name.toLowerCase() === e.target.value.toLowerCase());
                    newItems[index].drugId = match ? match.id : "";
                    setRxItems(newItems);
                  }}
                  list={`drug-list-${index}`}
                  className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                />
                <datalist id={`drug-list-${index}`}>
                  {drugs.map(d => (
                    <option key={d.id} value={d.name} />
                  ))}
                </datalist>
                {!item.drugId && item.search && (
                  <p className="text-xs text-red-500 mt-1">Please select a valid drug from the list.</p>
                )}
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Qty</label>
                <input 
                  type="number" min="1"
                  value={item.quantity}
                  onChange={e => {
                    const newItems = [...rxItems];
                    newItems[index].quantity = parseInt(e.target.value) || 1;
                    setRxItems(newItems);
                  }}
                  className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Instructions (Dosage)</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="e.g. Take 1 pill twice a day"
                    value={item.instructions}
                    onChange={e => {
                      const newItems = [...rxItems];
                      newItems[index].instructions = e.target.value;
                      setRxItems(newItems);
                    }}
                    className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                  />
                  {rxItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [...rxItems];
                        newItems.splice(index, 1);
                        setRxItems(newItems);
                      }}
                      className="mt-1 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                      title="Remove drug"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-2">
            <button 
              type="button" 
              onClick={() => setRxItems([...rxItems, { drugId: "", search: "", quantity: 1, instructions: "" }])}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              + Add another drug
            </button>
            <button type="submit" disabled={loading} className="py-2 px-6 rounded-xl shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-all flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Sign & Send to Pharmacy
            </button>
          </div>

        </form>
      </div>

      {/* Referral Form */}
      <div id="referral-form" className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 scroll-mt-24">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Send Patient Referral
        </h3>
        <p className="text-xs text-slate-500 mb-5">Generate a printable referral letter and save the destination for future use.</p>
        
        <form onSubmit={handleReferralSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Referral Type</label>
              <select 
                value={refType} 
                onChange={(e) => setRefType(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
              >
                <option value="Standard Referral">Standard Referral</option>
                <option value="Specialist Consultation">Specialist Consultation</option>
                <option value="Infrastructure / X-ray & Ultrasound">Infrastructure / X-ray & Ultrasound</option>
                <option value="Hospital (Transfer/Advanced Care)">Hospital (Transfer/Advanced Care)</option>
                <option value="Emergency Transfer">Emergency Transfer</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination Facility</label>
              <input 
                type="text"
                required
                value={refDest}
                onChange={(e) => setRefDest(e.target.value)}
                placeholder="Type or select from history"
                list="referral-destinations-list"
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
              />
              <datalist id="referral-destinations-list">
                {referralDestinations.map((dest, idx) => (
                  <option key={idx} value={dest} />
                ))}
              </datalist>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason & Findings</label>
            <textarea
              required
              rows={3}
              value={refReason}
              onChange={(e) => setRefReason(e.target.value)}
              placeholder="Detailed reason for referral, patient's current state, etc..."
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="button" 
              onClick={() => window.print()}
              className="py-2 px-4 rounded-xl shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
              title="Print the full patient medical history to attach with this referral"
            >
              <Printer className="w-4 h-4" />
              Print Patient History
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="py-2 px-6 rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Generate & Print Referral
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
