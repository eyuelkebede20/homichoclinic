import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ROLE_PERMISSIONS, PERMISSIONS, PermissionString } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) return new Response("Unauthorized", { status: 401 });

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  if (!userPermissions.includes(PERMISSIONS.CATALOG_REQUEST as PermissionString) && !userPermissions.includes(PERMISSIONS.CATALOG_APPROVE as PermissionString) && role !== "Admin" && role !== "Manager") {
    return new Response("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const format = searchParams.get("format");

  if (type === "drug") {
    const items = await prisma.drug.findMany({ 
      where: { deletedAt: null }, 
      orderBy: { name: "asc" },
      include: {
        batches: {
          orderBy: [{ dateAddedToStock: "desc" }, { createdAt: "desc" }]
        }
      }
    });

    const sampleRows = [
      {
        "id": "",
        "nameOfMed": "Amoxicillin 500mg",
        "description": "Oral Capsule 500mg",
        "price": 15.00,
        "category": "Antibiotics",
        "initialStock": 100,
        "amountInStock": 100,
        "batchNumber": "BAT-2026-001",
        "expiryDate": "2027-12-31",
        "dateAddedToStock": "2026-10-23",
        "docNo": "DOC-1024",
        "units": "Capsule",
      },
      {
        "id": "",
        "nameOfMed": "Paracetamol 120mg/5ml Syrup",
        "description": "Pediatric liquid formulation 100ml",
        "price": 45.00,
        "category": "Analgesics & Antipyretics",
        "initialStock": 50,
        "amountInStock": 50,
        "batchNumber": "BATCH-2026-B",
        "expiryDate": "2028-06-30",
        "dateAddedToStock": "2026-10-23",
        "docNo": "DOC-1025",
        "units": "Bottle",
      },
    ];

    const excelRows = items.length > 0 ? items.map((item) => {
      const latestBatch = item.batches?.[0];
      const totalBatches = item.batches && item.batches.length > 0
        ? item.batches.reduce((sum, b) => sum + b.quantity, 0)
        : null;
      const currentStock = totalBatches !== null ? totalBatches : (item.amountInStock ?? item.initialStock ?? "");
      const initialStock = item.initialStock ?? (totalBatches !== null ? totalBatches : "");

      const batchNumber = latestBatch?.batchNumber || "";
      const expiryDate = latestBatch?.expiryDate
        ? latestBatch.expiryDate.toISOString().split("T")[0]
        : "";
      const dateAddedToStock = latestBatch?.dateAddedToStock
        ? latestBatch.dateAddedToStock.toISOString().split("T")[0]
        : "";
      const docNo = latestBatch?.docNo || "";

      return {
        "id": item.id,
        "nameOfMed": item.name,
        "description": item.description || "",
        "price": item.price / 100,
        "category": item.category || "",
        "initialStock": initialStock,
        "amountInStock": currentStock,
        "batchNumber": batchNumber,
        "expiryDate": expiryDate,
        "dateAddedToStock": dateAddedToStock,
        "docNo": docNo,
        "units": item.unit || "",
      };
    }) : sampleRows;

    if (format === "xlsx") {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelRows);
      ws["!cols"] = [
        { wch: 28 }, // id
        { wch: 35 }, // nameOfMed
        { wch: 25 }, // description
        { wch: 12 }, // price
        { wch: 18 }, // category
        { wch: 14 }, // initialStock
        { wch: 14 }, // amountInStock
        { wch: 16 }, // batchNumber
        { wch: 14 }, // expiryDate
        { wch: 16 }, // dateAddedToStock
        { wch: 14 }, // docNo
        { wch: 14 }, // units
      ];
      XLSX.utils.book_append_sheet(wb, ws, "Pharmacy Catalog");

      // Guidance Sheet explaining columns
      const guideRows = [
        { "Column": "id", "Required": "Optional", "Description": "Unique database ID. Leave blank when adding new medications; preserve when updating existing drugs." },
        { "Column": "nameOfMed", "Required": "Required", "Description": "Generic or brand name of medication (e.g. Paracetamol 500mg, Amoxicillin 250mg/5ml)." },
        { "Column": "description", "Required": "Optional", "Description": "Strength, form, packaging remarks (e.g. 100ml bottle, 10x10 blister pack)." },
        { "Column": "price", "Required": "Required", "Description": "Selling price in ETB (e.g. 15.00, 45.50)." },
        { "Column": "category", "Required": "Optional", "Description": "Therapeutic class or category (e.g. Antibiotics, Analgesics, Antihypertensive)." },
        { "Column": "initialStock", "Required": "Optional", "Description": "Baseline or opening stock count quantity (e.g. 100)." },
        { "Column": "amountInStock", "Required": "Optional", "Description": "Current physical count stock quantity (e.g. 100)." },
        { "Column": "batchNumber", "Required": "Recommended", "Description": "Manufacturer lot / batch number (e.g. BAT-2026-001, LOT-9432)." },
        { "Column": "expiryDate", "Required": "Recommended", "Description": "Expiration date in YYYY-MM-DD or DD/MM/YYYY format (e.g. 2027-12-31)." },
        { "Column": "dateAddedToStock", "Required": "Optional", "Description": "Date stock received or entered in YYYY-MM-DD format (e.g. 2026-10-23)." },
        { "Column": "docNo", "Required": "Optional", "Description": "Receiving voucher, GRV, or supplier invoice number (e.g. INV-10024)." },
        { "Column": "units", "Required": "Recommended", "Description": "Measuring unit (e.g. Tab, Capsule, Vial, Ampoule, Bottle, Box, Strip)." },
      ];
      const wsGuide = XLSX.utils.json_to_sheet(guideRows);
      wsGuide["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 80 }];
      XLSX.utils.book_append_sheet(wb, wsGuide, "Template Guide & Instructions");

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new Response(buf, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="catalog-drug.xlsx"`,
        },
      });
    }

    let csvContent = "id,nameOfMed,description,price,category,initialStock,amountInStock,batchNumber,expiryDate,dateAddedToStock,docNo,units\n";
    for (const row of excelRows) {
      csvContent += `"${row.id}","${row.nameOfMed}","${row.description}",${row.price},"${row.category}",${row.initialStock},${row.amountInStock},"${row.batchNumber}","${row.expiryDate}","${row.dateAddedToStock}","${row.docNo}","${row.units}"\n`;
    }

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="catalog-drug.csv"`,
      },
    });
  } else if (type === "lab") {
    const items = await prisma.labTest.findMany({ orderBy: { name: "asc" } });

    if (format === "xlsx") {
      const XLSX = await import("xlsx");
      const excelRows = items.map((item) => ({
        "id": item.id,
        "nameOfTest": item.name,
        "unit / measuring unit": item.unit || "",
        "description": item.description || "",
        "price": item.price / 100,
        "tat": "",
        "category": "",
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelRows);
      ws["!cols"] = [
        { wch: 28 }, // id
        { wch: 35 }, // nameOfTest
        { wch: 22 }, // unit / measuring unit
        { wch: 25 }, // description
        { wch: 12 }, // price
        { wch: 12 }, // tat
        { wch: 18 }, // category
      ];
      XLSX.utils.book_append_sheet(wb, ws, "Lab Catalog");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new Response(buf, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="catalog-lab.xlsx"`,
        },
      });
    }

    let csvContent = "id,nameOfTest,unit / measuring unit,description,price,tat,category\n";
    for (const item of items) {
      const price = item.price / 100;
      csvContent += `"${item.id}","${item.name}","${item.unit || ""}","${item.description || ""}",${price},"",""\n`;
    }

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="catalog-lab.csv"`,
      },
    });
  } else {
    return new Response("Invalid type", { status: 400 });
  }
}
