"use server";

import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS, ROLE_PERMISSIONS, PermissionString } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const importCatalogSchema = z.object({
  csvText: z.string().min(1, "CSV text cannot be empty"),
  type: z.enum(["DRUG", "LAB_TEST"]),
});

function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const parseLine = (line: string) => {
    const result = [];
    let startValueIndex = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inQuotes = !inQuotes;
      else if (line[i] === ',' && !inQuotes) {
        result.push(line.substring(startValueIndex, i).replace(/^"|"$/g, '').trim());
        startValueIndex = i + 1;
      }
    }
    result.push(line.substring(startValueIndex).replace(/^"|"$/g, '').trim());
    return result;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase());
  
  return lines.slice(1).map(line => {
    const values = parseLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || "";
    });
    return obj;
  });
}

export const importCatalogCSV = createSafeAction({
  schema: importCatalogSchema,
  requiredPermission: PERMISSIONS.CATALOG_REQUEST,
  handler: async (data, ctx) => {
    const user = await prisma.user.findUnique({ where: { id: ctx.userId } });
    const perms = ROLE_PERMISSIONS[user?.role || "User"] || [];
    const canApprove = perms.includes(PERMISSIONS.CATALOG_APPROVE as PermissionString);

    const rows = parseCSV(data.csvText);
    if (rows.length === 0) {
      return { error: "No valid rows found in CSV." };
    }

    let processedCount = 0;
    let requestCount = 0;

    for (const row of rows) {
      const id = row["id"];
      const name = row["nameofmed"] || row["nameoftest"] || row["name"];
      if (!name) continue; // Name is required

      const priceEtb = parseFloat(row["price"] || "0");
      const priceCents = isNaN(priceEtb) ? 0 : Math.round(priceEtb * 100);
      const category = row["category"] || null;
      // tat can be appended to description or stored if we add a column later, for now we map it to description if it exists
      const tat = row["tat"];
      const description = tat ? `TAT: ${tat}` : null;

      if (data.type === "DRUG") {
        if (canApprove) {
          if (id) {
            await prisma.drug.update({
              where: { id },
              data: { name, price: priceCents, category, description }
            });
          } else {
            await prisma.drug.create({
              data: { name, price: priceCents, category, description }
            });
          }
          processedCount++;
        } else {
          await prisma.catalogChangeRequest.create({
            data: {
              type: "DRUG",
              action: id ? "UPDATE" : "CREATE",
              targetId: id || null,
              requestedData: JSON.stringify({ name, price: priceCents, category, description }),
              requestedById: ctx.userId,
            }
          });
          requestCount++;
        }
      } else { // LAB_TEST
        if (canApprove) {
          if (id) {
            await prisma.labTest.update({
              where: { id },
              data: { name, price: priceCents, description }
            });
          } else {
            await prisma.labTest.create({
              data: { name, price: priceCents, description }
            });
          }
          processedCount++;
        } else {
          await prisma.catalogChangeRequest.create({
            data: {
              type: "LAB_TEST",
              action: id ? "UPDATE" : "CREATE",
              targetId: id || null,
              requestedData: JSON.stringify({ name, price: priceCents, description }),
              requestedById: ctx.userId,
            }
          });
          requestCount++;
        }
      }
    }

    revalidatePath("/catalogs");
    revalidatePath("/catalogs/approvals");
    revalidatePath("/pharmacy/catalog");
    revalidatePath("/laboratory/catalog");

    if (canApprove) {
      return { success: `Successfully imported/updated ${processedCount} items directly.` };
    } else {
      return { success: `Submitted ${requestCount} items for approval.` };
    }
  }
});
