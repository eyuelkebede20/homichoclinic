import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";

  if (!query || query.length < 2) {
    // Return empty array if search is too short to avoid massive queries
    return NextResponse.json({ patients: [] });
  }

  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { contactNumber: { contains: query, mode: "insensitive" } },
        { employeeId: { contains: query, mode: "insensitive" } },
        { militaryId: { contains: query, mode: "insensitive" } },
        { id: { contains: query, mode: "insensitive" } }
      ]
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      contactNumber: true,
      discountPercent: true,
    },
    take: 10,
    orderBy: { firstName: "asc" }
  });

  return NextResponse.json({ patients });
}
