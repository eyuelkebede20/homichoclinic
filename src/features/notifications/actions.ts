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
    const doc = await prisma.user.findUnique({ where: { id: session.user.id } });
    const pending = await prisma.visit.findMany({
      where: {
        OR: [
          { doctorId: session.user.id },
          ...(doc?.currentOpdRoom ? [{ opdRoom: doc.currentOpdRoom }] : [])
        ],
        status: "scheduled"
      },
      include: { patient: true },
      orderBy: { updatedAt: "desc" },
      take: 5
    });
    count = await prisma.visit.count({
      where: {
        OR: [
          { doctorId: session.user.id },
          ...(doc?.currentOpdRoom ? [{ opdRoom: doc.currentOpdRoom }] : [])
        ],
        status: "scheduled"
      }
    });
    items = pending.map(p => ({
      id: p.id,
      title: "New Patient in Queue",
      desc: `${p.patient.firstName} ${p.patient.lastName} was assigned to your room.`,
      time: p.updatedAt.toLocaleTimeString(),
      link: `/dashboard`
    }));
  } 
  
  else if (role === "Pharmacy") {
    count = await prisma.prescription.count({ where: { status: "pending" } });
    const pending = await prisma.prescription.findMany({
      where: { status: "pending" },
      include: { patient: true },
      orderBy: { createdAt: "desc" },
      take: 5
    });
    items = pending.map(p => ({
      id: p.id,
      title: "New Prescription",
      desc: `Waiting to be dispensed for ${p.patient.firstName}.`,
      time: p.createdAt.toLocaleTimeString(),
      link: `/pharmacy`
    }));
  } 
  
  else if (role === "Laboratory") {
    count = await prisma.labRequest.count({ where: { status: { in: ["requested", "urgent"] } } });
    const pending = await prisma.labRequest.findMany({
      where: { status: { in: ["requested", "urgent"] } },
      include: { patient: true, test: true },
      orderBy: { createdAt: "desc" },
      take: 5
    });
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
