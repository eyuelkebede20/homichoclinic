"use client";

import * as XLSX from "xlsx";
import { Download } from "lucide-react";

export function ExportExcelButton({ 
  patients, 
  reportName 
}: { 
  patients: any[], 
  reportName: string 
}) {
  
  const handleExport = () => {
    // Flatten the data for Excel
    const rows: any[] = [];

    patients.forEach(agg => {
      // Add the summary row for the patient
      rows.push({
        "Patient Name": `${agg.patient.firstName} ${agg.patient.lastName}`,
        "Employee ID": agg.patient.employeeId || "N/A",
        "Invoice Date": "SUMMARY",
        "Item": `${agg.invoices.length} Invoices`,
        "Quantity": "",
        "Unit Price": "",
        "Subtotal": "",
        "Discount %": "",
        "Total Paid": agg.totalAmount / 100, // Assuming minor units
      });

      // Add detailed rows for each item in their invoices
      agg.invoices.forEach((inv: any) => {
        inv.items?.forEach((item: any) => {
          rows.push({
            "Patient Name": "",
            "Employee ID": "",
            "Invoice Date": new Date(inv.createdAt).toLocaleString(),
            "Item": item.description,
            "Quantity": item.quantity,
            "Unit Price": item.unitPrice / 100,
            "Subtotal": (item.quantity * item.unitPrice) / 100,
            "Discount %": inv.discountPercentApplied > 0 ? `${inv.discountPercentApplied}%` : "",
            "Total Paid": "", 
          });
        });
      });
      
      // Empty row for spacing between patients
      rows.push({});
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Z-Report");

    // Auto-size columns slightly
    worksheet["!cols"] = [
      { wch: 25 }, // Patient Name
      { wch: 15 }, // Employee ID
      { wch: 20 }, // Invoice Date
      { wch: 30 }, // Item
      { wch: 10 }, // Quantity
      { wch: 15 }, // Unit Price
      { wch: 15 }, // Subtotal
      { wch: 15 }, // Discount
      { wch: 15 }, // Total Paid
    ];

    // Trigger download
    XLSX.writeFile(workbook, `${reportName.replace(/ /g, '_')}.xlsx`);
  };

  return (
    <button 
      onClick={handleExport}
      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
    >
      <Download className="w-4 h-4" />
      Export Excel
    </button>
  );
}
