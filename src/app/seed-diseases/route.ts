import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CLINIC_DISEASES } from "@/features/clinical/types/diseases";

export async function GET(req: NextRequest) {
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

    const wantsJson = req.headers.get("accept")?.includes("application/json");
    if (wantsJson) {
      return NextResponse.json({
        success: true,
        count: finalDiseases.length,
        message: `Successfully seeded ${finalDiseases.length} clinic diseases.`,
      });
    }

    // Return friendly HTML page confirming seeding with quick link back to dashboard
    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Diseases Seeded Successfully</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4 font-sans">
  <div class="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center space-y-4">
    <div class="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl mx-auto flex items-center justify-center text-2xl font-bold">
      ✓
    </div>
    <h1 class="text-xl font-bold text-white">Clinic Diseases Catalog Seeded</h1>
    <p class="text-slate-300 text-sm">
      Successfully seeded <strong class="text-emerald-400 font-bold">${finalDiseases.length}</strong> standardized clinical diagnoses into the system setting.
    </p>
    <div class="pt-2 flex flex-col gap-2">
      <a href="/admin?tab=diseases" class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors">
        View Disease Catalog in Admin &rarr;
      </a>
      <a href="/dashboard" class="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-semibold transition-colors">
        Back to Dashboard
      </a>
    </div>
  </div>
</body>
</html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error: any) {
    console.error("Failed to seed diseases:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed diseases" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
