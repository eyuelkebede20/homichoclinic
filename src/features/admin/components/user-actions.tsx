"use client";

import { useState, useEffect } from "react";
import { deleteUser, resetUserPassword, updateUserRole, toggleUserActiveStatus } from "../actions";
import { Loader2, UserX, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function UserActionsRow({
  user,
  isDevMode = false,
}: {
  user: { id: string; email: string; role: string | null; isActive?: boolean | null };
  isDevMode?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [currentRole, setCurrentRole] = useState(user.role || "User");
  const [isActive, setIsActive] = useState(user.isActive !== false);
  const router = useRouter();

  useEffect(() => {
    setCurrentRole(user.role || "User");
    setIsActive(user.isActive !== false);
  }, [user.role, user.isActive]);

  async function handleToggleActive() {
    const nextState = !isActive;
    const actionText = nextState ? "activate" : "deactivate";
    if (
      !confirm(
        `Are you sure you want to ${actionText} ${user.email}? ${
          !nextState
            ? "They will be immediately logged out and unable to access the system until reactivated."
            : ""
        }`
      )
    ) {
      return;
    }

    setLoading(true);
    const res = await toggleUserActiveStatus({ userId: user.id, isActive: nextState });
    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      setIsActive(nextState);
      toast.success(
        nextState ? `Account for ${user.email} activated.` : `Account for ${user.email} deactivated.`
      );
      router.refresh();
    }
  }

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

  return (
    <div className="flex flex-wrap items-center gap-2 justify-end">
      {/* Role Selection */}
      <select
        value={currentRole}
        onChange={handleRoleChange}
        disabled={loading}
        title="Change staff role"
        className="text-xs rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 py-1 px-2"
      >
        {["User", "Admin", "Manager", "Reception", "Dataencoder", "Doctor", "Laboratory", "Testing", "Pharmacy"].map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      {/* Active / Inactive Status Toggle */}
      <button
        onClick={handleToggleActive}
        disabled={loading}
        type="button"
        title={isActive ? "Deactivate this staff member" : "Activate this staff member"}
        className={`text-xs px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 shadow-xs ${
          isActive
            ? "bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800"
            : "bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800"
        } disabled:opacity-50`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isActive ? (
          <>
            <UserX className="w-3.5 h-3.5" />
            Deactivate
          </>
        ) : (
          <>
            <UserCheck className="w-3.5 h-3.5" />
            Activate
          </>
        )}
      </button>

      {/* Password Reset */}
      <div className="flex items-center gap-1">
        <input
          type="password"
          placeholder="New pass..."
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="text-xs border border-slate-200 dark:border-slate-700 rounded p-1 w-24 dark:bg-slate-800 dark:text-slate-200"
        />
        <button
          onClick={handleResetPassword}
          disabled={loading || !newPassword}
          type="button"
          className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 px-2 py-1 rounded disabled:opacity-50"
        >
          Reset
        </button>
      </div>

      {/* Permanent Delete - Available in Dev Mode or for Admins */}
      {isDevMode && (
        <button
          onClick={handleDelete}
          disabled={loading}
          type="button"
          className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 px-2 py-1 rounded disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
        </button>
      )}
    </div>
  );
}
