import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/features/billing/utils";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) return new Response("Unauthorized", { status: 401 });

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  if (!userPermissions.includes(PERMISSIONS.INVOICE_READ)) {
    return new Response("Forbidden", { status: 403 });
  }

  const invoices = await prisma.invoice.findMany({
    take: 10000,
    include: { patient: true },
    orderBy: { createdAt: "desc" },
  });

  // Construct CSV
  const header = "Invoice ID,Date,Patient ID,Patient Name,Subtotal,Discount Applied (%),Total,Status\n";
  const rows = invoices.map(invoice => {
    const id = invoice.id;
    const date = invoice.createdAt.toISOString();
    const patientId = invoice.patientId;
    const patientName = `"${invoice.patient.firstName} ${invoice.patient.lastName}"`;
    const subtotal = formatCurrency(invoice.subtotal).replace(/,/g, '');
    const discount = invoice.discountPercentApplied;
    const total = formatCurrency(invoice.total).replace(/,/g, '');
    const status = invoice.status;
    
    return `${id},${date},${patientId},${patientName},${subtotal},${discount},${total},${status}`;
  }).join("\n");

  const csv = header + rows;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="invoices_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
