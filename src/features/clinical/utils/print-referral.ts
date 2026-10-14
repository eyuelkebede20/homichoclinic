export interface ReferralSheetData {
  patient: {
    firstName: string;
    lastName: string;
    gender?: string | null;
    yob?: string | number | null;
    department?: string | null;
    rank?: string | null;
  };
  destination?: string;
  reason?: string;
  doctorName?: string;
  date?: string;
  clinicNames?: {
    clinicName?: string;
    clinicNameAmharic?: string;
    clinicSubName?: string;
    clinicSubNameAmharic?: string;
    clinicLogo?: string;
  };
}

export function generateReferralHtml(data: ReferralSheetData): string {
  const { patient, destination = "", reason = "", doctorName = "", clinicNames } = data;

  const clinicName = clinicNames?.clinicName || "Clinic";
  const clinicNameAmharic = clinicNames?.clinicNameAmharic || "";
  
  // Resolve logo URL
  let logoUrl = clinicNames?.clinicLogo || "/icon.png";
  if (typeof window !== "undefined" && logoUrl && !logoUrl.startsWith("data:") && !logoUrl.startsWith("http")) {
    logoUrl = `${window.location.origin}${logoUrl.startsWith("/") ? "" : "/"}${logoUrl}`;
  }

  // Calculate age
  let patientAge = "";
  if (patient.yob) {
    const yobNum = typeof patient.yob === "string" ? parseInt(patient.yob, 10) : patient.yob;
    if (!isNaN(yobNum) && yobNum > 1900 && yobNum <= new Date().getFullYear()) {
      patientAge = String(new Date().getFullYear() - yobNum);
    }
  }

  const patientGender = (patient.gender || "").toLowerCase();
  const isMale = patientGender === "male" || patientGender === "m";
  const isFemale = patientGender === "female" || patientGender === "f";

  const todayStr = new Date().toISOString().split("T")[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Referral Sheet – ${clinicName}</title>
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

  /* Header */
  .header {
    text-align: center;
    margin-bottom: 8px;
  }
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

  /* Rows */
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

  /* Ruled text areas */
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

  /* Print Layout: Enforce exact 1 page fit on A4 */
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
      ${logoUrl ? `<img id="clinic-logo" src="${logoUrl}" alt="Clinic Logo" class="clinic-logo" />` : ''}
      <div class="clinic-titles">
        ${clinicNameAmharic ? `<div class="am" id="clinic-name-am">${clinicNameAmharic}</div>` : ''}
        <div class="en" id="clinic-name-en">${clinicName}</div>
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
        <input type="number" id="age" name="age" min="0" max="120" placeholder="Years" value="${patientAge}">
      </div>
      <div class="field narrow">
        <label for="sex">SEX</label>
        <select id="sex" name="sex">
          <option value="">Select</option>
          <option ${isMale ? 'selected' : ''}>Male</option>
          <option ${isFemale ? 'selected' : ''}>Female</option>
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
        <input type="text" id="from" name="referred_from" placeholder="Facility or clinician" value="${clinicName}">
      </div>
      <div class="field">
        <label for="to">REFERRED TO</label>
        <input type="text" id="to" name="referred_to" placeholder="Facility or specialist" value="${destination}">
      </div>
    </div>

    <div class="block">
      <label for="history">BRIEF HISTORY AND PHYSICAL FINDINGS</label>
      <textarea id="history" name="history_physical" class="l4" placeholder="Presenting complaint, history, examination findings">${reason}</textarea>
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
        <input type="text" id="dr" name="doctor" placeholder="Referring doctor's name and signature" value="${doctorName}">
      </div>
      <div class="field">
        <label for="date">Date</label>
        <input type="date" id="date" name="date" value="${todayStr}">
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
  
  // Default date
  var d = document.getElementById('date');
  if (d && !d.value) {
    var t = new Date();
    d.value = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  }

  // Trigger print after image load to prevent blank logo on print
  function triggerPrint() {
    window.focus();
    window.print();
  }

  var logoImg = document.getElementById('clinic-logo');
  if (logoImg) {
    if (logoImg.complete && logoImg.naturalHeight !== 0) {
      setTimeout(triggerPrint, 300);
    } else {
      logoImg.onload = function() { setTimeout(triggerPrint, 250); };
      logoImg.onerror = function() { setTimeout(triggerPrint, 250); };
    }
  } else {
    setTimeout(triggerPrint, 300);
  }
</script>
</body>
</html>`;
}

export function openPrintReferralWindow(data: ReferralSheetData) {
  const html = generateReferralHtml(data);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
