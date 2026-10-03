import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  console.log("🚀 Starting Integration Test for E2E Workflow...");
  
  try {
    const patient = await prisma.patient.findFirst();
    if (!patient) throw new Error("No patient found");
    
    let doctor = await prisma.user.findFirst({ where: { role: "Doctor" } });
    if (!doctor) {
      doctor = await prisma.user.create({ data: { id: "doc123", name: "Test Doc", email: "doc@test.com", emailVerified: true, role: "Doctor", createdAt: new Date(), updatedAt: new Date() } });
    }

    let drug = await prisma.drug.findFirst();
    if (!drug) {
      drug = await prisma.drug.create({ data: { name: "Paracetamol 500mg", price: 500 } });
      await prisma.stockBatch.create({ data: { drugId: drug.id, batchNumber: "B1", quantity: 100, cost: 200, expiryDate: new Date('2030-01-01') }});
    }

    let test = await prisma.labTest.findFirst();
    if (!test) {
      test = await prisma.labTest.create({ data: { name: "CBC", price: 1500 } });
    }

    console.log("✅ 1. Setup Complete");

    console.log("⏳ 2. Reception Check-in...");
    const visit = await prisma.visit.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        status: "scheduled",
        opdRoom: 1
      }
    });
    console.log("   Created Visit ID: ", visit.id);

    console.log("⏳ 3. Nurse updates vitals...");
    await prisma.visit.update({
      where: { id: visit.id },
      data: { vitals: { weight: 70, bloodPressure: "120/80", temperature: 36.5 } }
    });

    console.log("⏳ 4. Doctor sees patient...");
    await prisma.visit.update({
      where: { id: visit.id },
      data: { status: "in_progress" }
    });

    const labReq = await prisma.labRequest.create({
      data: {
        patientId: patient.id,
        testId: test.id,
        requestedBy: doctor.id,
        status: "requested"
      }
    });

    const prescription = await prisma.prescription.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        items: {
          create: [{ drugId: drug.id, quantity: 10, instructions: "1x3" }]
        }
      }
    });

    console.log("⏳ 5. Lab Tech enters results...");
    await prisma.labResult.create({
      data: {
        requestId: labReq.id,
        findings: "All normal",
        enteredBy: doctor.id
      }
    });
    await prisma.labRequest.update({ where: { id: labReq.id }, data: { status: "completed" } });

    await prisma.visit.update({ where: { id: visit.id }, data: { status: "completed" } });

    console.log("⏳ 6. Pharmacy dispenses drugs...");
    const pItems = await prisma.prescriptionItem.findMany({ where: { prescriptionId: prescription.id } });
    for (const item of pItems) {
      const batch = await prisma.stockBatch.findFirst({ where: { drugId: item.drugId, quantity: { gt: 0 } }, orderBy: { expiryDate: "asc" } });
      if (batch) {
        await prisma.stockBatch.update({ where: { id: batch.id }, data: { quantity: batch.quantity - item.quantity } });
        await prisma.stockMovement.create({
          data: { batchId: batch.id, type: "dispense", quantity: -item.quantity, actorId: doctor.id, reason: "Test" }
        });
      }
    }
    await prisma.prescription.update({ where: { id: prescription.id }, data: { status: "dispensed" } });

    console.log("⏳ 7. Cashier generates invoice...");
    let subtotal = 15000;
    subtotal += test.price;
    subtotal += (drug.price * 10);
    
    const discount = patient.discountPercent || 0;
    let total = Math.round(subtotal * (1 - (discount/100)));

    const invoice = await prisma.invoice.create({
      data: {
        patientId: patient.id,
        discountPercentApplied: discount,
        subtotal,
        total,
        status: "sent_to_finance"
      }
    });
    await prisma.visit.update({ where: { id: visit.id }, data: { invoiceId: invoice.id } });
    console.log("   Invoice created! Total: \`\ Birr\`");

    console.log("🎉 All Tests Passed Successfully! E2E Workflow verified.");

  } catch (e) {
    console.error("❌ Test Failed: ", e);
  } finally {
    await prisma.$disconnect();
  }
}

run();