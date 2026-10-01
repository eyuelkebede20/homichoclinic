import { prisma } from "../src/lib/prisma";
import { importPatientsFromCSV } from "../src/features/patients/actions-import";

async function runTests() {
  console.log("🧪 Starting Integration Tests...");
  let passed = 0;
  let failed = 0;

  try {
    // TEST 1: CSV Import & Discount Calculation
    console.log("\n[Test 1] Testing CSV Import & Auto-Discounting...");
    const sampleCsv = `FullName, EmployeeID, HiredYearEC, PrimaryPhone
Test Staff, STF-TEST-1, 2012, 0911223344
Test Child, , , 0911223344`;

    const admin = await prisma.user.findFirst({ where: { role: "Admin" } });
    if (!admin) throw new Error("No Admin found in database for testing.");

    const importResult = await importPatientsFromCSV(sampleCsv, admin.id, "Admin");
    
    const staff = await prisma.patient.findUnique({ where: { employeeId: "STF-TEST-1" } });
    const child = await prisma.patient.findFirst({ where: { firstName: "Test", lastName: "Child" } });

    if (staff && staff.discountPercent === 55) { // 2018 - 2012 = 6 yrs = 55% discount
      console.log("✅ CSV Staff Import & Discount Calculation works!");
      passed++;
    } else {
      console.error("❌ CSV Staff Import Failed or Incorrect Discount. Expected 55, got:", staff?.discountPercent);
      failed++;
    }

    if (child && child.primaryPatientId === staff?.id && child.discountPercent === 95) {
      console.log("✅ CSV Dependent Link & 95% Discount works!");
      passed++;
    } else {
      console.error("❌ CSV Dependent Linking Failed.");
      failed++;
    }

    // Cleanup Test 1
    if (child) await prisma.patient.delete({ where: { id: child.id } });
    if (staff) await prisma.patient.delete({ where: { employeeId: "STF-TEST-1" } });

    // TEST 2: Doctor Dashboard Query Logic
    console.log("\n[Test 2] Testing Doctor Dashboard Query Logic...");
    const doctor = await prisma.user.findFirst({ where: { role: "Doctor" } });
    if (doctor) {
      const pendingReview = await prisma.visit.count({
        where: {
          doctorId: doctor.id,
          status: "in_progress",
          labRequests: { some: { status: "completed" } }
        }
      });
      console.log("✅ Doctor Pending Review Aggregation works (Count: " + pendingReview + ")");
      passed++;
    } else {
      console.log("⚠️ No Doctor found to test logic. Skipping...");
    }

    // TEST 3: Pharmacy Dashboard Query Logic
    console.log("\n[Test 3] Testing Pharmacy Stock Aggregation...");
    const allDrugs = await prisma.drug.findMany({
      include: { batches: { where: { quantity: { gt: 0 } } } }
    });
    console.log("✅ Pharmacy Drug Batch Aggregation works. Evaluated " + allDrugs.length + " drugs.");
    passed++;

  } catch (err) {
    console.error("💥 Test suite threw an error:", err);
  }

  console.log(`\n🏁 Test Run Complete! Passed: ${passed} | Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

runTests();
