import { calculateAge, formatToEthiopianDate } from "@/lib/date-utils";
import { parseLabFindings, StoolPanelData, UrinePanelData, HematologyPanelData } from "../types/lab-panels";

export interface LabResultPrintData {
  patient: {
    firstName: string;
    lastName: string;
    gender?: string | null;
    yob?: string | number | null;
    department?: string | null;
    rank?: string | null;
    militaryId?: string | null;
    employeeId?: string | null;
  };
  testName: string;
  findings: string | null | undefined;
  requestedByName?: string;
  enteredByName?: string;
  isReadByDoctor?: boolean;
  date?: Date | string;
  clinicNames?: {
    clinicName?: string;
    clinicNameAmharic?: string;
    clinicSubName?: string;
    clinicSubNameAmharic?: string;
    clinicLogo?: string;
  };
}

export function generateLabResultHtml(data: LabResultPrintData): string {
  const {
    patient,
    testName,
    findings,
    requestedByName = "Doctor",
    enteredByName = "Laboratory Technician",
    date = new Date(),
    clinicNames,
  } = data;

  const clinicName = clinicNames?.clinicName || "Clinic";
  const clinicNameAmharic = clinicNames?.clinicNameAmharic || "";

  let logoUrl = clinicNames?.clinicLogo || "/icon.png";
  if (typeof window !== "undefined" && logoUrl && !logoUrl.startsWith("data:") && !logoUrl.startsWith("http")) {
    logoUrl = `${window.location.origin}${logoUrl.startsWith("/") ? "" : "/"}${logoUrl}`;
  }

  const ageDisplay = calculateAge(patient.yob);
  const patientId = patient.militaryId || patient.employeeId || "N/A";
  const testDateStr = formatToEthiopianDate(date, { format: "full" });
  const printDateStr = formatToEthiopianDate(new Date(), { format: "short" });

  const parsed = parseLabFindings(findings);

  // Helper to render findings based on panel type
  let contentHtml = "";

  if (parsed.type === "STOOL" && parsed.data) {
    const s = parsed.data as StoolPanelData;
    contentHtml = `
      <div class="panel-section">
        <div class="section-title">1. MACROSCOPIC & PHYSICAL EXAMINATION</div>
        <table class="data-table">
          <tr>
            <th>Appearance</th>
            <td>${s.appearance || "Normal"}</td>
            <th>Consistence</th>
            <td>${s.consistence || "Formed"}</td>
          </tr>
          <tr>
            <th>Gross Blood</th>
            <td>${s.bloodGross || "Negative"}</td>
            <th>Occult Blood (FOBT)</th>
            <td>${s.occult || "Negative"}</td>
          </tr>
          <tr>
            <th>Pus Cells</th>
            <td>${s.pus || "Nil"}</td>
            <th>Mucus</th>
            <td>${s.mucus || "Negative"}</td>
          </tr>
          <tr>
            <th>Bile</th>
            <td colspan="3">${s.bile || "Present"}</td>
          </tr>
        </table>
      </div>

      <div class="panel-section">
        <div class="section-title">2. MICROSCOPIC SALINE / IODINE MOUNT (OVA & PARASITES)</div>
        <div class="highlight-box">
          <div class="metric-title">Direct Wet Mount Findings:</div>
          <div class="metric-value font-bold">${s.ovaAndParasite || "No ova or parasite seen."}</div>
        </div>
      </div>

      ${
        s.remarks
          ? `
      <div class="panel-section">
        <div class="section-title">3. TECHNICIAN REMARKS & CLINICAL NOTES</div>
        <div class="notes-box">${s.remarks}</div>
      </div>`
          : ""
      }
    `;
  } else if (parsed.type === "URINE" && parsed.data) {
    const u = parsed.data as UrinePanelData;
    contentHtml = `
      <div class="panel-section">
        <div class="section-title">1. PHYSICAL & CHEMICAL EXAMINATION (DIPSTICK)</div>
        <table class="data-table">
          <tr>
            <th>Reaction (pH)</th>
            <td>${u.reaction || "6.0"}</td>
            <th>Specific Gravity</th>
            <td>${u.specificGravity || "1.015 - 1.025"}</td>
          </tr>
          <tr>
            <th>Albumin (Qualitative)</th>
            <td>${u.albuminQualitative || "Nil"}</td>
            <th>Albumin (Quantitative)</th>
            <td>${u.albuminQuantitative || "&lt; 30 mg/dL"}</td>
          </tr>
          <tr>
            <th>Sugar (Qualitative)</th>
            <td>${u.sugarQualitative || "Nil"}</td>
            <th>Sugar (Quantitative)</th>
            <td>${u.sugarQuantitative || "Normal"}</td>
          </tr>
          <tr>
            <th>Acetone / Ketones</th>
            <td>${u.acetone || "Negative"}</td>
            <th>Bilirubin</th>
            <td>${u.bilirubin || "Negative"}</td>
          </tr>
          <tr>
            <th>Urobilinogen</th>
            <td>${u.urobilinogen || "Normal"}</td>
            <th>Diacetic Acid</th>
            <td>${u.diaceticAcid || "Negative"}</td>
          </tr>
        </table>
      </div>

      <div class="panel-section">
        <div class="section-title">2. MICROSCOPIC SEDIMENT EXAMINATION (/HPF)</div>
        <div class="highlight-box">
          <div class="metric-title">Centrifuged Sediment Microscopic Report:</div>
          <div class="metric-value font-bold">${
            u.microscopic || "Pus cells: 0-2 /HPF, RBC: 0-1 /HPF, Epith cells: Few, Casts: Nil, Crystals: Nil"
          }</div>
        </div>
      </div>

      ${
        u.remarks
          ? `
      <div class="panel-section">
        <div class="section-title">3. REMARKS & INTERPRETATION</div>
        <div class="notes-box">${u.remarks}</div>
      </div>`
          : ""
      }
    `;
  } else if (parsed.type === "HEMATOLOGY" && parsed.data) {
    const h = parsed.data as HematologyPanelData;
    contentHtml = `
      <div class="panel-section">
        <div class="section-title">1. COMPLETE BLOOD COUNT (CBC) & CELL INDICES</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Investigation</th>
              <th>Patient Value</th>
              <th>Unit</th>
              <th>Biological Reference Interval</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-bold">Total W.B.C.</td>
              <td class="font-bold">${h.wbc || "N/A"}</td>
              <td>×10³/µL</td>
              <td>4.0 – 11.0</td>
            </tr>
            <tr>
              <td class="font-bold">Total R.B.C.</td>
              <td class="font-bold">${h.rbc || "N/A"}</td>
              <td>×10⁶/µL</td>
              <td>4.0 – 5.5</td>
            </tr>
            <tr>
              <td class="font-bold">Hemoglobin (Hgb)</td>
              <td class="font-bold">${h.hemoglobin || "N/A"}</td>
              <td>g/dL</td>
              <td>12.0 – 17.5</td>
            </tr>
            <tr>
              <td class="font-bold">Hematocrit (Hct / PCV)</td>
              <td class="font-bold">${h.hematocrit || "N/A"}</td>
              <td>%</td>
              <td>36.0 – 52.0</td>
            </tr>
            <tr>
              <td class="font-bold">Platelet Count</td>
              <td class="font-bold">${h.platelets || "N/A"}</td>
              <td>×10³/µL</td>
              <td>150 – 450</td>
            </tr>
            <tr>
              <td class="font-bold">E.S.R. (Westergren)</td>
              <td class="font-bold">${h.esr || "N/A"}</td>
              <td>mm/1st hr</td>
              <td>0 – 20</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="panel-section">
        <div class="section-title">2. DIFFERENTIAL LEUKOCYTE COUNT (%)</div>
        <table class="data-table">
          <tr>
            <th>Neutrophils (40-75%)</th>
            <td>${h.neutrophils ? h.neutrophils + "%" : "—"}</td>
            <th>Lymphocytes (20-45%)</th>
            <td>${h.lymphocytes ? h.lymphocytes + "%" : "—"}</td>
          </tr>
          <tr>
            <th>Monocytes (2-10%)</th>
            <td>${h.monocytes ? h.monocytes + "%" : "—"}</td>
            <th>Eosinophils (1-6%)</th>
            <td>${h.eosinophils ? h.eosinophils + "%" : "—"}</td>
          </tr>
          <tr>
            <th>Basophils (0-1%)</th>
            <td>${h.basophils ? h.basophils + "%" : "—"}</td>
            <th>Bands (0-5%)</th>
            <td>${h.bands ? h.bands + "%" : "—"}</td>
          </tr>
        </table>
      </div>

      ${
        h.bloodMorphology || h.remarks
          ? `
      <div class="panel-section">
        <div class="section-title">3. MORPHOLOGY & REMARKS</div>
        <div class="notes-box">
          ${h.bloodMorphology ? `<div><strong>Smear Morphology:</strong> ${h.bloodMorphology}</div>` : ""}
          ${h.remarks ? `<div><strong>Remarks:</strong> ${h.remarks}</div>` : ""}
        </div>
      </div>`
          : ""
      }
    `;
  } else {
    // Generic / raw findings
    let cleanText = parsed.rawText || findings || "No findings recorded.";
    if (cleanText.trim().startsWith("{") || cleanText.trim().startsWith("[")) {
      try {
        const obj = JSON.parse(cleanText.trim());
        const entries = Object.entries(obj).filter(([k]) => !["type", "id", "requestId"].includes(k));
        cleanText = entries
          .map(([k, v]) => `• ${k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").toUpperCase()}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
          .join("<br>");
      } catch {}
    }

    contentHtml = `
      <div class="panel-section">
        <div class="section-title">DIAGNOSTIC TEST FINDINGS & RESULTS</div>
        <div class="notes-box font-medium">${cleanText}</div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lab Result – ${testName} – ${patient.firstName} ${patient.lastName}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    margin: 0;
    padding: 16px;
    background: #f1f5f9;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: #000;
  }
  .sheet {
    max-width: 210mm;
    margin: 0 auto;
    background: #fff;
    padding: 24px 28px;
    border: 1px solid #cbd5e1;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  }
  @media print {
    body {
      background: #fff;
      padding: 0;
    }
    .sheet {
      border: none;
      box-shadow: none;
      padding: 0;
      width: 100%;
      max-width: 100%;
    }
    .no-print {
      display: none !important;
    }
  }
  .header {
    border-bottom: 2px solid #000;
    padding-bottom: 8px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .logo-box {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .logo-img {
    max-width: 56px;
    max-height: 56px;
    object-fit: contain;
  }
  .title-center {
    text-align: center;
    flex: 1;
    padding: 0 12px;
  }
  .clinic-name {
    font-size: 17px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0;
  }
  .clinic-amharic {
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;
    margin: 2px 0 0 0;
  }
  .report-badge {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 4px;
    color: #0f172a;
    display: inline-block;
    border-bottom: 1px solid #0f172a;
  }
  .ref-box {
    width: 100px;
    text-align: right;
    font-family: monospace;
    font-size: 10px;
  }
  .patient-matrix {
    border: 1px solid #000;
    background: #f8fafc;
    padding: 8px 12px;
    margin-bottom: 12px;
    font-size: 11px;
    border-radius: 4px;
  }
  .matrix-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px 12px;
  }
  .matrix-item span {
    display: block;
    color: #475569;
    font-size: 9px;
    text-transform: uppercase;
    font-weight: 600;
  }
  .matrix-item strong {
    color: #000;
    font-size: 11px;
  }
  .test-title-bar {
    background: #0f172a;
    color: #fff;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 4px 4px 0 0;
  }
  .test-title-bar span.status {
    background: #10b981;
    color: #fff;
    padding: 1px 8px;
    border-radius: 12px;
    font-size: 10px;
  }
  .panel-section {
    margin-top: 10px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .section-title {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #000;
    border-bottom: 1px solid #000;
    padding-bottom: 2px;
    margin-bottom: 6px;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    border: 1px solid #334155;
  }
  .data-table th, .data-table td {
    border: 1px solid #cbd5e1;
    padding: 4px 8px;
    text-align: left;
  }
  .data-table th {
    background: #f1f5f9;
    font-size: 10px;
    color: #0f172a;
    font-weight: 700;
    width: 25%;
  }
  .font-bold {
    font-weight: 700;
  }
  .highlight-box {
    border: 1px solid #000;
    background: #fff;
    padding: 8px 12px;
    border-radius: 4px;
  }
  .metric-title {
    font-size: 10px;
    color: #475569;
    font-weight: 700;
    text-transform: uppercase;
  }
  .metric-value {
    font-size: 12px;
    margin-top: 2px;
    color: #000;
  }
  .notes-box {
    border: 1px dashed #64748b;
    padding: 6px 10px;
    font-size: 11px;
    background: #f8fafc;
    border-radius: 4px;
    line-height: 1.4;
  }
  .signatures {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 2px solid #000;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .sig-block {
    text-align: center;
  }
  .sig-line {
    border-bottom: 1px solid #000;
    height: 36px;
    margin-bottom: 4px;
  }
  .sig-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .sig-name {
    font-size: 10px;
    color: #475569;
  }
  .footer-note {
    text-align: center;
    font-size: 9px;
    color: #64748b;
    margin-top: 10px;
    font-family: monospace;
    border-top: 1px solid #e2e8f0;
    padding-top: 4px;
  }
  .toolbar {
    margin-bottom: 16px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .btn {
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 700;
    border-radius: 6px;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }
  .btn-print {
    background: #2563eb;
    color: #fff;
  }
  .btn-print:hover {
    background: #1d4ed8;
  }
  .btn-close {
    background: #e2e8f0;
    color: #1e293b;
  }
  .btn-close:hover {
    background: #cbd5e1;
  }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <button class="btn btn-close" onclick="window.close()">Close</button>
    <button class="btn btn-print" onclick="window.print()">🖨️ Print Lab Report</button>
  </div>

  <div class="sheet">
    <div class="header">
      <div class="logo-box">
        <img src="${logoUrl}" alt="Logo" class="logo-img" onerror="this.style.display='none'">
      </div>
      <div class="title-center">
        <h1 class="clinic-name">${clinicName}</h1>
        ${clinicNameAmharic ? `<p class="clinic-amharic">${clinicNameAmharic}</p>` : ""}
        <div class="report-badge">LABORATORY DIAGNOSTIC REPORT / የላብራቶሪ ምርመራ ውጤት</div>
      </div>
      <div class="ref-box">
        <div><strong>OFFICIAL</strong></div>
        <div>Date: ${printDateStr}</div>
      </div>
    </div>

    <div class="patient-matrix">
      <div class="matrix-grid">
        <div class="matrix-item">
          <span>Patient Name</span>
          <strong>${patient.firstName} ${patient.lastName}</strong>
        </div>
        <div class="matrix-item">
          <span>Age / Sex</span>
          <strong>${ageDisplay} / ${patient.gender || "N/A"}</strong>
        </div>
        <div class="matrix-item">
          <span>Patient / Gov ID</span>
          <strong>${patientId}</strong>
        </div>
        <div class="matrix-item">
          <span>Department / Rank</span>
          <strong>${patient.department || patient.rank || "General"}</strong>
        </div>
        <div class="matrix-item">
          <span>Test Performed</span>
          <strong>${testName}</strong>
        </div>
        <div class="matrix-item">
          <span>Date Requested</span>
          <strong>${testDateStr}</strong>
        </div>
        <div class="matrix-item">
          <span>Requested By</span>
          <strong>${requestedByName}</strong>
        </div>
        <div class="matrix-item">
          <span>Conducted By</span>
          <strong>${enteredByName}</strong>
        </div>
      </div>
    </div>

    <div class="test-title-bar">
      <span>Investigation: ${testName}</span>
      <span class="status">✓ COMPLETED</span>
    </div>

    ${contentHtml}

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Laboratory Technician</div>
        <div class="sig-name">${enteredByName}</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Reviewing / Attending Physician</div>
        <div class="sig-name">${requestedByName}</div>
      </div>
    </div>

    <div class="footer-note">
      This document is an official clinical diagnostic record generated by the clinic laboratory information system.
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      // Auto-trigger print after short delay
      setTimeout(function() {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;
}

export function openPrintLabResultWindow(data: LabResultPrintData) {
  const html = generateLabResultHtml(data);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
