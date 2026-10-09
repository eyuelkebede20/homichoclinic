"use client";

import { useState, useEffect } from "react";
import { deleteUser, resetUserPassword, updateUserRole } from "../actions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function UserActionsRow({ user, isDevMode = false }: { user: { id: string; email: string; role: string | null }, isDevMode?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [currentRole, setCurrentRole] = useState(user.role || "User");
  const router = useRouter();
  useEffect(() => {
    setCurrentRole(user.role || "User");
  }, [user.role]);

  async function handleDelete() {
    if (!confirm(`Are you sure you want to permanently delete user ${user.email}?`)) return;
    setLoading(true);
    const res = await deleteUser({ userId: user.id });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else router.refresh();
  }

  async function handleResetPassword() {
    if (!newPassword || newPassword.length < 6) {
      toast.success("Please enter a valid password (min 6 characters) in the adjacent input box.");
      return;
    }
    if (!confirm(`Reset password for ${user.email}? This will immediately log them out.`)) return;

    setLoading(true);
    const res = await resetUserPassword({ userId: user.id, newPassword });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Password reset successfully.");
      setNewPassword("");
      router.refresh();
    }
  }

  async function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value;
    if (!confirm(`Change role to ${newRole}?`)) {
      e.target.value = currentRole;
      return;
    }
    
    setCurrentRole(newRole); // Optimistic update
    setLoading(true);
    const res = await updateUserRole({ userId: user.id, role: newRole });
    setLoading(false);
    
    if (res.error) {
      toast.error(res.error);
      setCurrentRole(user.role || "User"); // Revert on failure
    } else {
      router.refresh();
    }
  }

  if (!isDevMode) {
    return <span className="text-slate-400 dark:text-slate-500 text-xs italic">Enable Dev Mode to manage</span>;
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={currentRole}
        onChange={handleRoleChange}
        disabled={loading}
        className="text-xs rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 py-1 px-2"
      >
        {["User", "Admin", "Manager", "Reception", "Dataencoder", "Doctor", "Laboratory", "Testing", "Pharmacy"].map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        <input 
          type="password"
          placeholder="New pass..."
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className="text-xs border border-slate-200 dark:border-slate-700 rounded p-1 w-24 dark:bg-slate-800 dark:text-slate-200"
        />
        <button
          onClick={handleResetPassword}
          disabled={loading || !newPassword}
          className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 px-2 py-1 rounded disabled:opacity-50"
        >
          Reset
        </button>
      </div>

      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 px-2 py-1 rounded disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
      </button>
    </div>
  );
}
