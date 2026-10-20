"use server";

import { createSafeAction } from "@/lib/safe-action";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const importCatalogSchema = z.object({
  csvText: z.string().min(1, "CSV text cannot be empty"),
  type: z.enum(["DRUG", "LAB_TEST"]),
});

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCSV(text: string): Record<string, string>[] {
  // Strip UTF-8 BOM if present
  const cleanedText = text.replace(/^\uFEFF/, "");
  const lines = cleanedText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Detect delimiter: check first line for comma vs semicolon vs tab
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ",";
  if (semiCount > commaCount && semiCount > tabCount) {
    delimiter = ";";
  } else if (tabCount > commaCount && tabCount > semiCount) {
    delimiter = "\t";
  }

  const parseLine = (line: string, delim: string) => {
    const result: string[] = [];
    let startValueIndex = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === delim && !inQuotes) {
        result.push(
          line.substring(startValueIndex, i).replace(/^"|"$/g, "").trim()
        );
        startValueIndex = i + 1;
      }
    }
    result.push(
      line.substring(startValueIndex).replace(/^"|"$/g, "").trim()
    );
    return result;
  };

  const rawHeaders = parseLine(lines[0], delimiter);
  const normalizedHeaders = rawHeaders.map(normalizeKey);

  return lines
    .slice(1)
    .map((line) => {
      const values = parseLine(line, delimiter);
      const row: Record<string, string> = {};
      normalizedHeaders.forEach((header, index) => {
        if (header) {
          row[header] = (values[index] || "").trim();
        }
      });
      return row;
    })
    .filter((row) => Object.values(row).some((val) => val.length > 0));
}

function getField(row: Record<string, string>, aliases: string[]): string {
  // Pass 1: exact normalized match
  for (const alias of aliases) {
    const norm = normalizeKey(alias);
    if (row[norm] !== undefined && row[norm] !== "") {
      return row[norm];
    }
  }

  // Pass 2: partial substring match (e.g. "unitpriceetb" matching "unitprice" or "price")
  for (const alias of aliases) {
    const norm = normalizeKey(alias);
    if (norm.length < 3) continue; // avoid overly broad matching on short codes
    for (const key of Object.keys(row)) {
      if (key.includes(norm) && row[key] !== "") {
        return row[key];
      }
    }
  }
  return "";
}

export const importCatalogCSV = createSafeAction({
  schema: importCatalogSchema,
  requiredPermission: PERMISSIONS.CATALOG_REQUEST,
  handler: async (data, ctx) => {
    const canApprove = true;

    const rows = parseCSV(data.csvText);
    if (rows.length === 0) {
      return { error: "No valid rows found in CSV/Excel file." };
    }

    let processedCount = 0;
    let updatedCount = 0;
    let createdCount = 0;

    for (const row of rows) {
      const id = getField(row, ["id", "drugid", "testid", "itemid", "code"]);
      const name = getField(row, [
        "nameofmed",
        "medicinename",
        "drugname",
        "nameoftest",
        "testname",
        "drug",
        "medicine",
        "itemname",
        "item",
        "name",
      ]);

      if (!name) continue; // Name is required

      const priceRaw = getField(row, [
        "price",
        "unitprice",
        "sellingprice",
        "priceetb",
        "cost",
        "unitcost",
        "rate",
        "fee",
      ]).replace(/[^0-9.]/g, "");
      const priceEtb = parseFloat(priceRaw || "0");
      const priceCents = isNaN(priceEtb) ? 0 : Math.round(priceEtb * 100);

      const category =
        getField(row, ["category", "dosageform", "form", "type", "class", "group"]) ||
        null;
      const unit =
        getField(row, [
          "units",
          "unit",
          "unitmeasuringunit",
          "measuringunit",
          "measuring",
          "unitofmeasurement",
          "uom",
          "measurementunit",
          "packagingunit",
          "packunit",
        ]) || null;
      const description =
        getField(row, [
          "description",
          "desc",
          "strength",
          "specification",
          "remark",
          "notes",
          "note",
        ]) || null;

      // Initial Stock (Hamle baseline / initial input)
      const initialStockRaw = getField(row, [
        "initialstock",
        "initialinput",
        "hamleinput",
        "hamle",
        "hamlestock",
        "initialinstock",
        "startingstock",
        "openingstock",
        "baseline",
        "initial",
      ]);

      // Current Stock / amountInStock (counted quantity / temporary hamle input)
      const currentStockRaw = getField(row, [
        "amountinstock",
        "amountin_stock",
        "currentstock",
        "currentinstock",
        "physicalcount",
        "countedstock",
        "actualstock",
      ]);

      // Generic Stock column (e.g. "Stock", "Quantity")
      const genericStockRaw = getField(row, [
        "stock",
        "quantity",
        "qty",
        "amount",
        "balance",
      ]);

      let parsedInitialStock: number | null = null;
      let parsedCurrentStock: number | null = null;

      if (initialStockRaw !== "") {
        const parsed = parseInt(initialStockRaw, 10);
        if (!isNaN(parsed)) parsedInitialStock = parsed;
      }

      if (currentStockRaw !== "") {
        const parsed = parseInt(currentStockRaw, 10);
        if (!isNaN(parsed)) parsedCurrentStock = parsed;
      }

      // If initial stock and current stock were not explicitly named, but a generic stock column is present:
      // Map generic stock to initialStock!
      if (parsedInitialStock === null && parsedCurrentStock === null && genericStockRaw !== "") {
        const parsed = parseInt(genericStockRaw, 10);
        if (!isNaN(parsed)) {
          parsedInitialStock = parsed;
        }
      }

      const batchNumber =
        getField(row, [
          "batchnumber",
          "batchno",
          "batch",
          "lotnumber",
          "lotno",
          "lot",
        ]) || null;

      const expiryDateStr =
        getField(row, ["expirydate", "expiry", "expdate", "exp", "expirationdate"]) ||
        null;
      const expiryDate = expiryDateStr ? new Date(expiryDateStr) : new Date("2099-12-31");
      const validExpiry = isNaN(expiryDate.getTime()) ? new Date("2099-12-31") : expiryDate;

      const dateAddedToStockStr =
        getField(row, [
          "dateaddedtostock",
          "dateadded",
          "addeddate",
          "receiptdate",
          "date",
        ]) || null;
      const dateAddedToStock = dateAddedToStockStr ? new Date(dateAddedToStockStr) : null;
      const validDateAdded =
        dateAddedToStock && !isNaN(dateAddedToStock.getTime()) ? dateAddedToStock : null;

      const docNo =
        getField(row, ["docno", "documentno", "receiptno", "receipt", "invoiceno", "invoice", "refno"]) ||
        null;

      if (data.type === "DRUG") {
        if (canApprove) {
          // Check if drug already exists by ID or by Case-Insensitive Name
          let existingDrug = null;
          if (id) {
            existingDrug = await prisma.drug.findUnique({ where: { id } });
          }
          if (!existingDrug) {
            existingDrug = await prisma.drug.findFirst({
              where: {
                name: { equals: name.trim(), mode: "insensitive" },
                deletedAt: null,
              },
            });
          }

          let drug;
          if (existingDrug) {
            // Update existing drug
            const updatePayload: {
              name: string;
              price?: number;
              category?: string | null;
              unit?: string | null;
              description?: string | null;
              initialStock?: number | null;
              amountInStock?: number | null;
            } = {
              name: name.trim(),
            };

            if (priceCents > 0 || !existingDrug.price) {
              updatePayload.price = priceCents;
            }
            if (category) {
              updatePayload.category = category;
            }
            if (unit) {
              updatePayload.unit = unit;
            }
            if (description) {
              updatePayload.description = description;
            }
            if (parsedInitialStock !== null) {
              updatePayload.initialStock = parsedInitialStock;
            }
            if (parsedCurrentStock !== null) {
              updatePayload.amountInStock = parsedCurrentStock;
            }

            drug = await prisma.drug.update({
              where: { id: existingDrug.id },
              data: updatePayload,
            });
            updatedCount++;
          } else {
            // Create brand new drug
            drug = await prisma.drug.create({
              data: {
                ...(id ? { id } : {}),
                name: name.trim(),
                price: priceCents,
                category,
                unit,
                description,
                initialStock: parsedInitialStock,
                amountInStock: parsedCurrentStock,
              },
            });
            createdCount++;
          }

          // Synchronize physical in-stock batches with effective stock
          // If there is an initial input, use it as primary stock available (not out of stock!)
          const effectiveStock = parsedCurrentStock ?? parsedInitialStock;
          if (effectiveStock !== null) {
            if (effectiveStock === 0) {
              await prisma.stockBatch.updateMany({
                where: { drugId: drug.id },
                data: { quantity: 0 },
              });
            } else {
              const bNum = batchNumber || `HAMLE-${new Date().getFullYear()}`;
              const existingBatches = await prisma.stockBatch.findMany({
                where: { drugId: drug.id, ...(batchNumber ? { batchNumber } : {}) },
                orderBy: { createdAt: "desc" },
              });

              if (existingBatches.length > 0) {
                await prisma.stockBatch.update({
                  where: { id: existingBatches[0].id },
                  data: {
                    quantity: effectiveStock,
                    expiryDate: validExpiry,
                    dateAddedToStock: validDateAdded,
                    docNo: docNo || "HAMLE-BASELINE-IMPORT",
                  },
                });
                if (existingBatches.length > 1) {
                  const olderBatchIds = existingBatches.slice(1).map((b) => b.id);
                  await prisma.stockBatch.updateMany({
                    where: { id: { in: olderBatchIds } },
                    data: { quantity: 0 },
                  });
                }
              } else {
                await prisma.stockBatch.create({
                  data: {
                    drugId: drug.id,
                    batchNumber: bNum,
                    expiryDate: validExpiry,
                    quantity: effectiveStock,
                    cost: priceCents || 0,
                    dateAddedToStock: validDateAdded || new Date(),
                    docNo: docNo || "HAMLE-BASELINE-IMPORT",
                  },
                });
              }
            }
          }

          processedCount++;
        }
      } else {
        // LAB_TEST
        if (canApprove) {
          let existingTest = null;
          if (id) {
            existingTest = await prisma.labTest.findUnique({ where: { id } });
          }
          if (!existingTest) {
            existingTest = await prisma.labTest.findFirst({
              where: {
                name: { equals: name.trim(), mode: "insensitive" },
                deletedAt: null,
              },
            });
          }

          if (existingTest) {
            await prisma.labTest.update({
              where: { id: existingTest.id },
              data: {
                name: name.trim(),
                ...(priceCents > 0 ? { price: priceCents } : {}),
                ...(unit ? { unit } : {}),
                ...(description ? { description } : {}),
              },
            });
            updatedCount++;
          } else {
            await prisma.labTest.create({
              data: {
                ...(id ? { id } : {}),
                name: name.trim(),
                price: priceCents,
                unit,
                description,
              },
            });
            createdCount++;
          }
          processedCount++;
        }
      }
    }

    revalidatePath("/catalogs");
    revalidatePath("/catalogs/approvals");
    revalidatePath("/pharmacy/catalog");
    revalidatePath("/pharmacy");
    revalidatePath("/laboratory/catalog");

    return {
      success: `Successfully processed ${processedCount} items (${createdCount} new, ${updatedCount} updated).`,
    };
  },
});
