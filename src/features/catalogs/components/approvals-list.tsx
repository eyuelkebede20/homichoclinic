"use client";

import { useState } from "react";
import { processCatalogApproval, bulkApproveCatalogRequests } from "../actions";
import { CheckCircle, XCircle, Loader2, Edit, CheckSquare } from "lucide-react";

export function ApprovalsList({ requests, isPending }: { requests: any[], isPending: boolean }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPayload, setEditPayload] = useState<any>(null);

  async function handleAction(id: string, approve: boolean, customPayload?: any) {
    if (!approve && !confirm(`Are you sure you want to reject this request?`)) return;
    setLoadingId(id);
    const res = await processCatalogApproval({ id, approve, modifiedPayload: customPayload });
    setLoadingId(null);
    if (res?.error) alert(res.error);
    if (res?.fieldErrors) alert("Validation error.");
    setEditingId(null);
  }

  async function handleBulkApprove() {
    const pendingIds = requests.filter(r => r.status === "PENDING").map(r => r.id);
    if (pendingIds.length === 0) return;
    if (!confirm(`Approve all ${pendingIds.length} pending requests?`)) return;
    
    setBulkLoading(true);
    const res = await bulkApproveCatalogRequests({ ids: pendingIds });
    setBulkLoading(false);
    if (res?.error) alert(res.error);
  }

  if (requests.length === 0) {
    return <p className="text-sm text-slate-500">No requests found.</p>;
  }

  return (
    <div className="space-y-4">
      {isPending && requests.length > 1 && (
        <div className="flex justify-end">
          <button
            onClick={handleBulkApprove}
            disabled={bulkLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
            Approve All Pending
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
        <table className="min-w-full text-left text-sm divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300">Type / Action</th>
              <th className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300">Requester</th>
              <th className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300">Details</th>
              {!isPending && <th className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300">Status</th>}
              {isPending && <th className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {requests.map(req => {
              const basePayload = JSON.parse(req.requestedData || "{}");
              const isEditing = editingId === req.id;
              const payload = isEditing ? editPayload : basePayload;

              return (
                <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                      req.action === 'CREATE' ? 'bg-green-100 text-green-800' : 
                      req.action === 'DELETE' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {req.action}
                    </span>
                    <div className="mt-1 text-xs text-slate-500 font-medium">{req.type.replace("_", " ")}</div>
                  </td>
                  
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{req.requestedBy?.name || 'Unknown'}</div>
                  </td>
                  
                  <td className="px-4 py-3">
                    {req.action === "DELETE" ? (
                      <span className="text-slate-500 font-mono text-xs">Target ID: {req.targetId}</span>
                    ) : isEditing ? (
                      <div className="space-y-2 min-w-[200px]">
                        {payload.name !== undefined && (
                          <input 
                            type="text" 
                            value={payload.name} 
                            onChange={e => setEditPayload({...payload, name: e.target.value})}
                            className="block w-full text-xs rounded border border-slate-300 dark:border-slate-600 px-2 py-1 dark:bg-slate-950" 
                            placeholder="Name"
                          />
                        )}
                        {payload.price !== undefined && (
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" 
                              value={payload.price / 100} 
                              onChange={e => setEditPayload({...payload, price: Math.round(parseFloat(e.target.value || "0") * 100)})}
                              className="block w-24 text-xs rounded border border-slate-300 dark:border-slate-600 px-2 py-1 dark:bg-slate-950" 
                              step="0.01"
                            />
                            <span className="text-xs text-slate-500">ETB</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
                        {payload.name && <div><span className="font-semibold text-slate-500">Name:</span> {payload.name}</div>}
                        {payload.price !== undefined && <div><span className="font-semibold text-slate-500">Price:</span> {(payload.price / 100).toFixed(2)} ETB</div>}
                        {payload.category && <div><span className="font-semibold text-slate-500">Cat:</span> {payload.category}</div>}
                      </div>
                    )}
                  </td>
                  
                  {!isPending && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-xs font-bold ${req.status === "APPROVED" ? "text-green-600" : "text-red-600"}`}>
                        {req.status}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">by {req.evaluatedBy?.name || 'Unknown'}</div>
                    </td>
                  )}

                  {isPending && (
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(req.id, true, payload)}
                            disabled={loadingId === req.id}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded font-medium disabled:opacity-50 hover:bg-green-700"
                          >
                            {loadingId === req.id ? "..." : "Save & Approve"}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded font-medium hover:bg-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            disabled={loadingId === req.id}
                            onClick={() => { setEditingId(req.id); setEditPayload(basePayload); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded disabled:opacity-50"
                            title="Edit & Approve"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            disabled={loadingId === req.id}
                            onClick={() => handleAction(req.id, true)}
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded disabled:opacity-50"
                            title="Approve"
                          >
                            {loadingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button
                            disabled={loadingId === req.id}
                            onClick={() => handleAction(req.id, false)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-50"
                            title="Reject"
                          >
                            {loadingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
