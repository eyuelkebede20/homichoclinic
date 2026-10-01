/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { processCatalogApproval } from "../actions";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export function ApprovalsList({ requests, isPending }: { requests: any[], isPending: boolean }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAction(id: string, approve: boolean) {
    if (!confirm(`Are you sure you want to ${approve ? 'approve' : 'reject'} this request?`)) return;
    setLoadingId(id);
    const res = await processCatalogApproval({ id, approve });
    setLoadingId(null);
    if (res?.error) alert(res.error);
    if (res?.fieldErrors) alert("Validation error.");
  }

  if (requests.length === 0) {
    return <p className="text-sm text-slate-500">No requests found.</p>;
  }

  return (
    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
      {requests.map(req => {
        const payload = JSON.parse(req.requestedData || "{}");
        return (
          <li key={req.id} className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  {req.action} {req.type.replace("_", " ")}
                </p>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Requested by: <span className="font-medium">{req.requestedBy?.name || 'Unknown'}</span>
                </div>
                
                <div className="mt-2 bg-slate-50 dark:bg-slate-950 p-3 rounded text-xs font-mono text-slate-700 dark:text-slate-300">
                  {req.action === "DELETE" ? (
                    <p>Target ID: {req.targetId}</p>
                  ) : (
                    <div>
                      {payload.name && <p>Name: {payload.name}</p>}
                      {payload.price !== undefined && <p>Price: {(payload.price / 100).toFixed(2)} ETB</p>}
                      {payload.category && <p>Category: {payload.category}</p>}
                      {payload.description && <p>Description: {payload.description}</p>}
                    </div>
                  )}
                </div>
                
                {!isPending && (
                  <p className="mt-2 text-xs font-bold flex items-center">
                    Status: &nbsp;
                    {req.status === "APPROVED" ? (
                      <span className="text-green-600">APPROVED</span>
                    ) : (
                      <span className="text-red-600">REJECTED</span>
                    )}
                    &nbsp; by {req.evaluatedBy?.name || 'Unknown'}
                  </p>
                )}
              </div>

              {isPending && (
                <div className="flex items-center space-x-2">
                  <button
                    disabled={loadingId === req.id}
                    onClick={() => handleAction(req.id, true)}
                    className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-full disabled:opacity-50"
                    title="Approve"
                  >
                    {loadingId === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  </button>
                  <button
                    disabled={loadingId === req.id}
                    onClick={() => handleAction(req.id, false)}
                    className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-full disabled:opacity-50"
                    title="Reject"
                  >
                    {loadingId === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
