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

  let csvContent = "";

  if (type === "drug") {
    const items = await prisma.drug.findMany({ orderBy: { name: "asc" } });
    csvContent = "id,nameOfMed,description,price,category,amountInStock,batchNumber,expiryDate,dateAddedToStock,docNo\n";
    for (const item of items) {
      const price = item.price / 100; // to ETB
      const stock = item.amountInStock ?? "";
      csvContent += `"${item.id}","${item.name}","${item.description || ""}",${price},"${item.category || ""}",${stock},,,,\n`;
    }
  } else if (type === "lab") {
    const items = await prisma.labTest.findMany({ orderBy: { name: "asc" } });
    csvContent = "id,nameOfTest,description,price,tat,category\n";
    for (const item of items) {
      const price = item.price / 100;
      csvContent += `"${item.id}","${item.name}","${item.description || ""}",${price},"",""\n`;
    }
  } else {
    return new Response("Invalid type", { status: 400 });
  }

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="catalog-${type}.csv"`,
    },
  });
}
