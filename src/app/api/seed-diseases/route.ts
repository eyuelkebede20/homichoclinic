import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CLINIC_DISEASES } from "@/features/clinical/types/diseases";

export async function GET(req: NextRequest) {
  return handleSeed(req);
}

export async function POST(req: NextRequest) {
  return handleSeed(req);
}

async function handleSeed(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "merge";

    let finalDiseases = [...DEFAULT_CLINIC_DISEASES];

    if (mode === "merge") {
      const existing = await prisma.systemSetting.findUnique({
        where: { key: "clinicDiseasesList" },
      });
      if (existing?.value) {
        try {
          const parsed = JSON.parse(existing.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingNames = new Set(parsed.map((d: any) => d.name.toLowerCase()));
            const merged = [...parsed];
            for (const def of DEFAULT_CLINIC_DISEASES) {
              if (!existingNames.has(def.name.toLowerCase())) {
                merged.push(def);
              }
            }
            finalDiseases = merged;
          }
        } catch (e) {
          console.error("Failed to parse existing diseases:", e);
        }
      }
    }

    await prisma.systemSetting.upsert({
      where: { key: "clinicDiseasesList" },
      update: { value: JSON.stringify(finalDiseases) },
      create: { key: "clinicDiseasesList", value: JSON.stringify(finalDiseases) },
    });

    return NextResponse.json({
      success: true,
      count: finalDiseases.length,
      mode,
      message: `Successfully seeded ${finalDiseases.length} clinic diseases into the catalog.`,
    });
  } catch (error: any) {
    console.error("Failed to seed diseases:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed diseases" },
      { status: 500 }
    );
  }
}
