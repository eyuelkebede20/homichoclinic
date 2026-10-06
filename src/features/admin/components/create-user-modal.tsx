"use client";

import { useState } from "react";
import { createUser } from "../actions";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export function CreateUserModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createUser({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: formData.get("role") as string,
    });
    setLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      setIsOpen(false);
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm flex items-center shadow-sm"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create User
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
        <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Create New User</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input required name="name" type="text" className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input required name="email" type="email" className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input required name="password" type="password" minLength={6} className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select required name="role" className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2">
              <option value="Reception">Reception</option>
              <option value="Dataencoder">Dataencoder</option>
              <option value="Doctor">Doctor</option>
              <option value="Laboratory">Laboratory</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center disabled:opacity-50">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create Account
          </button>
        </div>
      </form>
    </div>
  );
}
