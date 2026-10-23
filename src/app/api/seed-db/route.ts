import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { DEFAULT_CLINIC_DISEASES } from "@/features/clinical/types/diseases";

export async function GET() {
  try {
    const staffToCreate = [
      { role: "Admin", name: "Alice Admin" },
      { role: "Manager", name: "Mark Manager" },
      { role: "Doctor", name: "Dr. Drake" },
      { role: "Reception", name: "Rachel Reception" },
      { role: "Dataencoder", name: "Danny Dataencoder" },
      { role: "Laboratory", name: "Leo LabTech" },
      { role: "Pharmacy", name: "Penny Pharmacist" },
    ];

    let createdCount = 0;

    for (const staff of staffToCreate) {
      const email = `${staff.role.toLowerCase()}@clinic.com`;
      const existingUser = await prisma.user.findFirst({ where: { email } });

      if (!existingUser) {
        // Register the user through Better Auth (handles hashing securely)
        await auth.api.signUpEmail({
          body: {
            email: email,
            password: "password123",
            name: staff.name,
          },
        });

        // Force assign the correct role
        await prisma.user.updateMany({
          where: { email },
          data: { role: staff.role },
        });
        createdCount++;
      }
    }

    // Seed dummy patient if empty
    const existingPatient = await prisma.patient.findFirst();
    if (!existingPatient) {
      await prisma.patient.create({
        data: {
          firstName: "John",
          lastName: "Doe",
          gender: "male",
          yob: "1985",
          contactNumber: "555-0192",
          discountPercent: 10,
        },
      });
    }

    // Seed core lab tests and sub-tests if not present
    const defaultCoreTests = [
      // Core Stool & Sub-tests
      { name: "Stool Examination", price: 5000, description: "Complete stool examination (appearance, consistence, occult, parasites, etc.)" },
      { name: "Stool - Ova & Parasite (Microscopic)", price: 3000, description: "Direct wet mount and concentration for ova, cysts, and trophozoites" },
      { name: "Stool - Occult Blood (FOBT)", price: 2500, description: "Detection of hidden fecal blood / gastrointestinal bleeding" },
      { name: "Stool - Macroscopic & Physical", price: 2000, description: "Appearance, consistence, gross blood, pus, mucus & bile" },
      { name: "Stool - Appearance & Consistency", price: 1500, description: "Evaluation of stool appearance and consistency" },
      { name: "Stool - Gross Blood", price: 1500, description: "Visual inspection for macroscopic gross blood" },
      { name: "Stool - Pus & Mucus", price: 1500, description: "Screening for fecal pus cells and mucus" },
      { name: "Stool - Bile", price: 1500, description: "Stool bile assessment" },

      // Core Urine & Sub-tests
      { name: "Urine Examination", price: 5000, description: "Routine urinalysis (physical, chemical dipstick & microscopic sediment)" },
      { name: "Urine - Physical Examination (Quantity, Reaction, Specific Gravity)", price: 2000, description: "Quantity, pH reaction, and specific gravity" },
      { name: "Urine - Chemical Dipstick (Protein/Sugar/pH)", price: 3000, description: "Multistix chemical reagent strip test" },
      { name: "Urine - Microscopic Sediment Examination", price: 3000, description: "Centrifuged sediment analysis for WBC, RBC, casts, crystals, bacteria" },
      { name: "Urine - Albumin / Protein Test (Qualitative & Quantitative)", price: 2000, description: "Qualitative and quantitative urinary protein/albumin" },
      { name: "Urine - Sugar / Glucose Test (Qualitative & Quantitative)", price: 2000, description: "Qualitative and semi-quantitative urinary glucose" },
      { name: "Urine - Acetone & Diacetic Acid", price: 2000, description: "Screening for ketones: acetone and diacetic acid" },
      { name: "Urine - Bile & Urobilinogen (Bilirubin & Urobilin)", price: 2000, description: "Bile pigments, bilirubin, urobilinogen, and urobilin screening" },
      { name: "Urine - 17-Ketosteroids", price: 3000, description: "Urinary 17-ketosteroids assessment" },
      { name: "Urine - Electrolytes (Na & K)", price: 3000, description: "Urinary Sodium (Na) and Potassium (K) levels" },

      // Core Hematology & Sub-tests
      { name: "Hematology", price: 10000, description: "Complete blood count (CBC), differential, indices, ESR & morphology" },
      { name: "Hematology - WBC & Differential Count", price: 4000, description: "Total WBC and Differential (Neutrophils, Bands, Lymphocytes, Monocytes, Eosinophils, Basophils, Blast, Myelocytes)" },
      { name: "Hematology - Hemoglobin & Hematocrit (Hgb/Hct)", price: 3500, description: "Hemoglobin and hematocrit concentration" },
      { name: "Hematology - RBC Count", price: 3000, description: "Red blood cell count" },
      { name: "Hematology - Platelet Count", price: 3000, description: "Platelet evaluation and count" },
      { name: "Hematology - Reticulocyte Count", price: 3000, description: "Reticulocyte percentage and count" },
      { name: "Hematology - ESR (Sedimentation Rate)", price: 2500, description: "Erythrocyte Sedimentation Rate" },
      { name: "Hematology - Coagulation Profile (Bleeding, Clotting & Prothrombin Time)", price: 4500, description: "Bleeding time, coagulation time, prothrombin time" },
      { name: "Hematology - RBC Indices (MCV, MCH, MCHC)", price: 3000, description: "Mean Corpuscular Volume, MCH, and MCHC" },
      { name: "Hematology - Blood Smear Morphology", price: 3500, description: "Peripheral blood smear examination and cellular morphology" },
    ];

    for (const core of defaultCoreTests) {
      const exists = await prisma.labTest.findFirst({
        where: { name: { equals: core.name, mode: "insensitive" } }
      });
      if (!exists) {
        await prisma.labTest.create({
          data: {
            name: core.name,
            price: core.price,
            description: core.description,
            isOperational: true,
          }
        });
      }
    }

    // Seed clinic diseases catalog (220+ items)
    await prisma.systemSetting.upsert({
      where: { key: "clinicDiseasesList" },
      update: { value: JSON.stringify(DEFAULT_CLINIC_DISEASES) },
      create: { key: "clinicDiseasesList", value: JSON.stringify(DEFAULT_CLINIC_DISEASES) },
    });

    return NextResponse.json({
      success: true,
      message: `Seeded test users, core lab tests, and 220+ clinic diseases. You can now log in! Password is password123 for all.`,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
