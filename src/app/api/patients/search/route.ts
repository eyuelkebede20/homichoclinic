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

  const term = query.trim();
  if (!term) {
    return NextResponse.json({ patients: [] });
  }

  const isDigitsOnly = /^\d+$/.test(term);
  const phoneVariants = [term];
  if (isDigitsOnly) {
    if (term.startsWith("0")) {
      phoneVariants.push(term.slice(1));
      phoneVariants.push(`+251${term.slice(1)}`);
    } else if (term.startsWith("251")) {
      phoneVariants.push(`+${term}`);
      phoneVariants.push(`0${term.slice(3)}`);
    } else {
      phoneVariants.push(`0${term}`);
      phoneVariants.push(`+251${term}`);
    }
  }

  const phoneConditions = phoneVariants.flatMap(v => [
    { contactNumber: { contains: v, mode: "insensitive" as const } },
    { primaryPatient: { contactNumber: { contains: v, mode: "insensitive" as const } } }
  ]);

  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
        ...phoneConditions,
        { employeeId: { contains: term, mode: "insensitive" } },
        { militaryId: { contains: term, mode: "insensitive" } },
        { yob: { contains: term, mode: "insensitive" } },
        { id: { contains: term, mode: "insensitive" } },
        {
          primaryPatient: {
            OR: [
              { firstName: { contains: term, mode: "insensitive" } },
              { lastName: { contains: term, mode: "insensitive" } },
              { employeeId: { contains: term, mode: "insensitive" } },
              { militaryId: { contains: term, mode: "insensitive" } },
            ]
          }
        }
      ]
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      contactNumber: true,
      discountPercent: true,
      patientType: true,
      relationship: true,
      militaryId: true,
      employeeId: true,
      rank: true,
      division: true,
      department: true,
      primaryPatient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          contactNumber: true,
          employeeId: true,
          militaryId: true,
          patientType: true,
          rank: true,
        }
      }
    },
    take: 10,
    orderBy: { firstName: "asc" }
  });

  return NextResponse.json({ patients });
}
