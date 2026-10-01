import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { LabResultForm } from "@/features/clinical/components/lab-result-form"; // We'll create this

export default async function LaboratoryDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role || "User";
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  
  if (!userPermissions.includes(PERMISSIONS.LAB_READ)) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to access the laboratory module.</p>
      </div>
    );
  }

  // Fetch pending requests
  const pendingRequests = await prisma.labRequest.findMany({
    where: { status: "requested" },
    include: {
      patient: true,
      test: true,
    },
    orderBy: { createdAt: "asc" }
  });

  const canResult = userPermissions.includes(PERMISSIONS.LAB_RESULT);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laboratory Dashboard</h1>
          <p className="text-slate-500">Manage pending lab requests and input results.</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No pending lab requests.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Test</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {pendingRequests.map(req => (
                <tr key={req.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {req.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {req.patient.firstName} {req.patient.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {req.test.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canResult ? (
                      <LabResultForm requestId={req.id} />
                    ) : (
                      <span className="text-slate-400">View Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
