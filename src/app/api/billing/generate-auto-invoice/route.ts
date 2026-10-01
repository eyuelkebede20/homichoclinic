/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const role = session.user.role || "User";
    const userPermissions = ROLE_PERMISSIONS[role] || [];
    if (!userPermissions.includes(PERMISSIONS.INVOICE_CREATE)) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
    }

    // 1. Fetch unbilled items
    const [patient, visits, labRequests, prescriptions] = await Promise.all([
      prisma.patient.findUnique({ where: { id: patientId } }),
      prisma.visit.findMany({ where: { patientId, invoiceId: null } }),
      prisma.labRequest.findMany({ where: { patientId, invoiceId: null }, include: { test: true } }),
      prisma.prescriptionItem.findMany({ where: { prescription: { patientId }, invoiceId: null }, include: { drug: true } }),
    ]);

    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    if (visits.length === 0 && labRequests.length === 0 && prescriptions.length === 0) {
      // Nothing to bill
      return NextResponse.redirect(new URL("/billing", request.url), 303);
    }

    // 2. Map them to Invoice Items
    const invoiceItems: any[] = [];
    
    // Configurable flat visit fee (e.g., 100 ETB)
    const VISIT_FEE = 10000; // Minor units

    visits.forEach(v => {
      invoiceItems.push({
        description: `Consultation / Visit on ${v.visitDate.toLocaleDateString()}`,
        quantity: 1,
        unitPrice: VISIT_FEE,
        isDiscountable: true,
      });
    });

    labRequests.forEach(l => {
      invoiceItems.push({
        description: `Lab Test: ${l.test.name}`,
        quantity: 1,
        unitPrice: l.test.price,
        isDiscountable: true,
      });
    });

    prescriptions.forEach(p => {
      invoiceItems.push({
        description: `Pharmacy: ${p.drug.name} (${p.quantity} units)`,
        quantity: p.quantity,
        unitPrice: p.drug.price,
        isDiscountable: true, // Typically drugs might not be discountable, but assuming true here
      });
    });

    // 3. Compute totals
    let discountableTotal = 0;
    let nonDiscountableTotal = 0;

    invoiceItems.forEach(item => {
      const lineTotal = item.unitPrice * item.quantity;
      if (item.isDiscountable) discountableTotal += lineTotal;
      else nonDiscountableTotal += lineTotal;
    });

    const subtotal = discountableTotal + nonDiscountableTotal;
    const discountAmount = Math.round((discountableTotal * patient.discountPercent) / 100);
    const total = subtotal - discountAmount;

    // 4. Transaction: Create Invoice + Attach Items + Link original models
    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          patientId,
          discountPercentApplied: patient.discountPercent,
          subtotal,
          total,
          items: {
            create: invoiceItems
          }
        }
      });

      // Update original entities to point to this invoice
      if (visits.length > 0) {
        await tx.visit.updateMany({
          where: { id: { in: visits.map(v => v.id) } },
          data: { invoiceId: invoice.id }
        });
      }

      if (labRequests.length > 0) {
        await tx.labRequest.updateMany({
          where: { id: { in: labRequests.map(l => l.id) } },
          data: { invoiceId: invoice.id }
        });
      }

      if (prescriptions.length > 0) {
        await tx.prescriptionItem.updateMany({
          where: { id: { in: prescriptions.map(p => p.id) } },
          data: { invoiceId: invoice.id }
        });
      }
    });

    // Redirect back to billing
    return NextResponse.redirect(new URL("/billing", request.url), 303);

  } catch (err: any) {
    console.error("Auto invoice generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
