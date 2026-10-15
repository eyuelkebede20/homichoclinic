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
    const items = await prisma.drug.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });

    if (format === "xlsx") {
      const XLSX = await import("xlsx");
      const excelRows = items.map((item) => ({
        "id": item.id,
        "nameOfMed": item.name,
        "description": item.description || "",
        "price": item.price / 100,
        "category": item.category || "",
        "hamle-input": item.initialStock ?? "",
        "initialStock": item.initialStock ?? "",
        "amountInStock": item.amountInStock ?? "",
        "batchNumber": "",
        "expiryDate": "",
        "dateAddedToStock": "",
        "docNo": "",
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelRows);
      ws["!cols"] = [
        { wch: 28 }, // id
        { wch: 35 }, // nameOfMed
        { wch: 20 }, // description
        { wch: 12 }, // price
        { wch: 18 }, // category
        { wch: 14 }, // hamle-input
        { wch: 14 }, // initialStock
        { wch: 14 }, // amountInStock
        { wch: 16 }, // batchNumber
        { wch: 14 }, // expiryDate
        { wch: 16 }, // dateAddedToStock
        { wch: 14 }, // docNo
      ];
      XLSX.utils.book_append_sheet(wb, ws, "Pharmacy Catalog");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new Response(buf, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="catalog-drug.xlsx"`,
        },
      });
    }

    let csvContent = "id,nameOfMed,description,price,category,hamle-input,initialStock,amountInStock,batchNumber,expiryDate,dateAddedToStock,docNo\n";
    for (const item of items) {
      const price = item.price / 100; // to ETB
      const initialStock = item.initialStock ?? "";
      const hamleInput = item.initialStock ?? "";
      const stock = item.amountInStock ?? "";
      csvContent += `"${item.id}","${item.name}","${item.description || ""}",${price},"${item.category || ""}",${hamleInput},${initialStock},${stock},,,,\n`;
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
    let csvContent = "id,nameOfTest,description,price,tat,category\n";
    for (const item of items) {
      const price = item.price / 100;
      csvContent += `"${item.id}","${item.name}","${item.description || ""}",${price},"",""\n`;
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
