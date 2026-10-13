"use client";

import { useState } from "react";
import { Send, Loader2, X, Printer } from "lucide-react";
import { toast } from "sonner";
import { saveReferral } from "../actions";

export function ReferralButton({
  patient,
  referralDestinations = [],
  clinicNames,
  defaultReason = "",
}: {
  patient: any;
  referralDestinations?: string[];
  clinicNames?: { clinicName?: string; clinicNameAmharic?: string; clinicSubName?: string; clinicSubNameAmharic?: string; clinicLogo?: string };
  defaultReason?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [refType, setRefType] = useState("Standard Referral");
  const [refDest, setRefDest] = useState("");
  const [refReason, setRefReason] = useState(defaultReason);

  async function handleReferralSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!refDest.trim() || !refReason.trim()) {
      toast.error("Destination and Reason are required.");
      return;
    }
    setLoading(true);
    const res = await saveReferral({
      patientId: patient.id,
      type: refType,
      destination: refDest,
      reason: refReason,
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
<title>Referral Sheet – ${clinicNames?.clinicName || "Clinic"}</title>
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
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--desk);
    color: var(--ink);
    font-family: "Times New Roman", Times, "Liberation Serif", serif;
    font-size: 13.5px;
    line-height: 1.25;
    padding: 16px 12px 32px;
  }

  .sheet {
    max-width: 780px;
    margin: 0 auto;
    background: var(--paper);
    padding: 24px 32px;
    box-shadow: 0 1px 6px rgba(0,0,0,.15);
  }

  .header { text-align: center; margin-bottom: 8px; }
  .clinic-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
  }
  .clinic-logo {
    max-width: 55px;
    max-height: 55px;
    object-fit: contain;
  }
  .clinic-titles {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .clinic-titles .am {
    font-size: 14.5px;
    font-weight: 700;
    line-height: 1.25;
  }
  .clinic-titles .en {
    font-size: 14.5px;
    font-weight: 700;
    letter-spacing: .02em;
    line-height: 1.25;
  }
  .title {
    display: inline-block;
    margin: 6px 0 0;
    font-size: 19px;
    font-weight: 700;
    letter-spacing: .05em;
    border-bottom: 2px solid var(--ink);
    padding-bottom: 1px;
  }

  form { margin-top: 10px; }
  .row {
    display: flex;
    gap: 14px;
    align-items: flex-end;
    margin-bottom: 9px;
  }
  .field {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    flex: 1 1 0;
    min-width: 0;
  }
  .field.wide { flex: 2 1 0; }
  .field.narrow { flex: .55 1 0; }
  label {
    font-weight: 700;
    white-space: nowrap;
    font-size: 12.5px;
    letter-spacing: .01em;
  }
  input[type="text"], input[type="number"], input[type="date"], select {
    flex: 1;
    min-width: 0;
    font: inherit;
    font-size: 13px;
    color: var(--ink);
    background: transparent;
    border: 0;
    border-bottom: 1px solid var(--rule);
    border-radius: 0;
    padding: 1px 3px;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
  }
  select { background: transparent; }

  input:focus, textarea:focus, select:focus {
    border-bottom-color: var(--focus);
    box-shadow: 0 1.5px 0 0 var(--focus);
  }

  .block { margin-bottom: 8px; }
  .block > label {
    display: block;
    margin-bottom: 1px;
    font-size: 12px;
    letter-spacing: .01em;
  }
  textarea {
    display: block;
    width: 100%;
    font: inherit;
    font-size: 13px;
    color: var(--ink);
    background-image: repeating-linear-gradient(
      to bottom,
      transparent 0, transparent 19px,
      var(--rule) 19px, var(--rule) 20px
    );
    background-attachment: local;
    border: 0;
    line-height: 20px;
    padding: 0 4px;
    resize: none;
    outline: none;
    overflow: hidden;
  }
  textarea.l3 { height: 40px; }
  textarea.l4 { height: 60px; }

  .signoff {
    margin-top: 12px;
    margin-bottom: 0;
  }

  .actions {
    max-width: 780px;
    margin: 12px auto 0;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  button {
    font: inherit;
    font-size: 13px;
    padding: 6px 14px;
    border: 1px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  button.primary { background: var(--ink); color: #fff; }
  button:focus-visible { outline: 2px solid var(--focus); outline-offset: 1px; }

  ::placeholder { color: var(--hint); opacity: 1; font-size: 12px; font-style: italic; }

  @media (max-width: 640px) {
    .sheet { padding: 18px 14px; }
    .row { flex-direction: column; align-items: stretch; gap: 10px; }
    .title { font-size: 17px; }
  }

  @media print {
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    html, body {
      background: #fff;
      padding: 0;
      margin: 0;
      height: 100%;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      box-shadow: none;
      padding: 0;
      max-width: 100%;
      width: 100%;
      page-break-after: avoid;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .actions { display: none !important; }
    ::placeholder { color: transparent; }
    input, textarea, select { border-color: #000; }
    select { background: none; }
    * {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  }
</style>

</head>
<body>

<main class="sheet">
  <header class="header">
    <div class="clinic-header">
      ${clinicNames?.clinicLogo ? `<img src="${clinicNames.clinicLogo}" class="clinic-logo" alt="Logo" />` : ''}
      <div class="clinic-titles">
        ${clinicNames?.clinicNameAmharic ? `<div class="am">${clinicNames.clinicNameAmharic}</div>` : ''}
        ${clinicNames?.clinicName ? `<div class="en">${clinicNames.clinicName}</div>` : ''}
      </div>
    </div>
    <h1 class="title">REFERRAL SHEET</h1>
  </header>

  <form id="referral" autocomplete="off">
    <div class="row">
      <div class="field wide">
        <label for="name">NAME</label>
        <input type="text" id="name" name="name" placeholder="Full name of patient" value="${patient.firstName} ${patient.lastName}">
      </div>
      <div class="field narrow">
        <label for="age">AGE</label>
        <input type="number" id="age" name="age" min="0" max="120" placeholder="Years" value="${patient.yob ? new Date().getFullYear() - parseInt(patient.yob, 10) : ''}">
      </div>
      <div class="field narrow">
        <label for="sex">SEX</label>
        <select id="sex" name="sex">
          <option value="">Select</option>
          <option ${patient.gender?.toLowerCase() === 'male' ? 'selected' : ''}>Male</option>
          <option ${patient.gender?.toLowerCase() === 'female' ? 'selected' : ''}>Female</option>
        </select>
      </div>
    </div>

    <div class="row">
      <div class="field wide">
        <label for="unit">UNIT</label>
        <input type="text" id="unit" name="unit" placeholder="Department or unit" value="${patient.department || ''}">
      </div>
      <div class="field">
        <label for="rank">RANK</label>
        <input type="text" id="rank" name="rank" placeholder="Rank or position" value="${patient.rank || ''}">
      </div>
    </div>

    <div class="row">
      <div class="field">
        <label for="from">REFERRED FROM</label>
        <input type="text" id="from" name="referred_from" placeholder="Facility or clinician" value="${clinicNames?.clinicName || clinicNames?.clinicNameAmharic || ''}">
      </div>
      <div class="field">
        <label for="to">REFERRED TO</label>
        <input type="text" id="to" name="referred_to" placeholder="Facility or specialist" value="${refDest}">
      </div>
    </div>

    <div class="block">
      <label for="history">BRIEF HISTORY AND PHYSICAL FINDINGS</label>
      <textarea id="history" name="history_physical" class="l4" placeholder="Presenting complaint, history, examination findings">${refReason}</textarea>
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
      setIsOpen(false);
      setRefDest("");
      setRefReason("");
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600"
      >
        <Send className="w-3.5 h-3.5" />
        Generate Referral
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                Patient Referral
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="referral-form-modal" onSubmit={handleReferralSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Referral Type</label>
                    <select 
                      value={refType} 
                      onChange={(e) => setRefType(e.target.value)}
                      className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm"
                    >
                      <option value="Standard Referral">Standard Referral</option>
                      <option value="Specialist Consultation">Specialist Consultation</option>
                      <option value="Infrastructure / X-ray & Ultrasound">Infrastructure / X-ray & Ultrasound</option>
                      <option value="Hospital (Transfer/Advanced Care)">Hospital (Transfer/Advanced Care)</option>
                      <option value="Emergency Transfer">Emergency Transfer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Destination Facility</label>
                    <input 
                      type="text" required value={refDest} onChange={(e) => setRefDest(e.target.value)}
                      placeholder="Type or select from history" list="ref-dest-list-modal"
                      className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm"
                    />
                    <datalist id="ref-dest-list-modal">
                      {referralDestinations.map((dest, idx) => <option key={idx} value={dest} />)}
                    </datalist>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Reason & Findings</label>
                  <textarea
                    required rows={4} value={refReason} onChange={(e) => setRefReason(e.target.value)}
                    placeholder="Detailed reason for referral..."
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm"
                  />
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between bg-slate-50 dark:bg-slate-900/50">
              <button 
                type="button" 
                onClick={() => window.print()}
                className="py-2 px-4 rounded-xl text-sm font-medium border bg-white hover:bg-slate-50 dark:bg-slate-800 flex items-center gap-2"
                title="Print the full patient medical history"
              >
                <Printer className="w-4 h-4" /> History
              </button>
              <button 
                type="submit" form="referral-form-modal" disabled={loading} 
                className="py-2 px-6 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Generate & Print
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
