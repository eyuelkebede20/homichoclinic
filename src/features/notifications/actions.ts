"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function getNotifications() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { count: 0, items: [] };

  const role = session.user.role || "User";
  let count = 0;
  let items: { id: string; title: string; desc: string; time: string; link: string }[] = [];

  if (role === "Doctor") {
    const currentOpdRoom = (session.user as any).currentOpdRoom;
    let room = currentOpdRoom;
    if (!room) {
      const doc = await prisma.user.findUnique({ where: { id: session.user.id }, select: { currentOpdRoom: true } });
      room = doc?.currentOpdRoom;
    }
    const where = {
      OR: [
        { doctorId: session.user.id },
        ...(room ? [{ opdRoom: room }] : [])
      ],
      status: "scheduled",
      opdRoom: { not: null },
      visitDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    };

    const [pending, totalCount] = await Promise.all([
      prisma.visit.findMany({
        where,
        select: {
          id: true,
          updatedAt: true,
          patient: { select: { firstName: true, lastName: true } }
        },
        orderBy: { updatedAt: "desc" },
        take: 5
      }),
      prisma.visit.count({ where })
    ]);

    count = totalCount;
    items = pending.map(p => ({
      id: p.id,
      title: "New Patient in Queue",
      desc: `${p.patient.firstName} ${p.patient.lastName} was assigned to your room.`,
      time: p.updatedAt.toLocaleTimeString(),
      link: `/dashboard`
    }));
  } 
  
  else if (role === "Pharmacy") {
    const where = { status: "pending" };
    const [pending, totalCount] = await Promise.all([
      prisma.prescription.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          patient: { select: { firstName: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 5
      }),
      prisma.prescription.count({ where })
    ]);

    count = totalCount;
    items = pending.map(p => ({
      id: p.id,
      title: "New Prescription",
      desc: `Waiting to be dispensed for ${p.patient.firstName}.`,
      time: p.createdAt.toLocaleTimeString(),
      link: `/pharmacy`
    }));
  } 
  
  else if (role === "Laboratory") {
    const where = { status: { in: ["requested", "urgent"] } };
    const [pending, totalCount] = await Promise.all([
      prisma.labRequest.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          patient: { select: { firstName: true } },
          test: { select: { name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 5
      }),
      prisma.labRequest.count({ where })
    ]);

    count = totalCount;
    items = pending.map(p => ({
      id: p.id,
      title: "New Lab Request",
      desc: `${p.test.name} requested for ${p.patient.firstName}.`,
      time: p.createdAt.toLocaleTimeString(),
      link: `/laboratory`
    }));
  } 
  
  else if (role === "Admin" || role === "Manager") {
    count = 0;
    items = [];
  }

  return { count, items };
}
