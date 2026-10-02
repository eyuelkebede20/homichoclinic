"use client";

import { useState } from "react";
import { saveClinicProfile } from "../actions";

export function ClinicProfileSettings({
  initialName,
  initialLogo
}: {
  initialName: string;
  initialLogo: string;
}) {
  const [name, setName] = useState(initialName);
  const [logo, setLogo] = useState(initialLogo);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    
    try {
      const res = await saveClinicProfile({ clinicName: name, clinicLogo: logo });
      if (res.error) {
        setError(res.error);
      } else {
        setMessage("Clinic profile updated successfully.");
        // Refresh page to update layout
        window.location.reload();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 p-6 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">Clinic Profile Settings</h2>
      
      {error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm">{error}</div>}
      {message && <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-sm">{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Clinic Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Acme Health Clinic"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Clinic Logo URL
          </label>
          <input
            type="url"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            className="w-full px-3 py-2 border rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/logo.png"
          />
          <p className="text-xs text-slate-500 mt-1">Provide a direct URL to an image file (PNG, JPG, SVG). It will be scaled to fit the sidebar.</p>
        </div>

        {logo && (
          <div className="mt-4 p-4 border rounded-md border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Preview:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="Logo Preview" className="h-12 w-12 object-contain rounded bg-white p-1 shadow-sm" />
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
