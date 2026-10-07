"use client";

import { useState, useEffect } from "react";
import { saveClinicProfile } from "../actions";

export function ClinicProfileSettings({
  initialName,
  initialAmharicName,
  initialLogo
}: {
  initialName: string;
  initialAmharicName: string;
  initialLogo: string;
}) {
  const [name, setName] = useState(initialName);
  const [amharicName, setAmharicName] = useState(initialAmharicName);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cacheBuster, setCacheBuster] = useState("");

  useEffect(() => {
    // Only generate the timestamp on the client to prevent SSR hydration mismatches
    setCacheBuster(`?t=${Date.now()}`);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    
    try {
      // Just save name now, logo is handled via file upload to /icon.png
      const res = await saveClinicProfile({ clinicName: name, clinicNameAmharic: amharicName, clinicLogo: "/icon.png" });
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
    <div className="bg-white dark:bg-slate-900 shadow rounded-lg border border-slate-200 dark:border-slate-800 p-6 max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">Clinic Profile Settings</h2>
        
        {error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-sm">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Clinic Name (English)
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
              Clinic Name (Amharic)
            </label>
            <input
              type="text"
              value={amharicName}
              onChange={(e) => setAmharicName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 font-amharic"
              placeholder="e.g. አክሜ ጤና ክሊኒክ"
            />
            <p className="text-xs text-slate-500 mt-1">This will be used alongside the logo in official letters.</p>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Names"}
            </button>
          </div>
        </form>
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Clinic Logo</h3>
        <p className="text-sm text-slate-500 mb-4">This logo will be used as the site favicon and in the dashboard.</p>
        
        <div className="flex items-center gap-6 mb-4">
          <div className="p-4 border rounded-md border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Logo:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/icon.png${cacheBuster}`} alt="Current logo" className="h-16 w-16 object-contain rounded bg-white p-1 shadow-sm" />
          </div>

          <form
            action="/api/upload-logo"
            method="POST"
            encType="multipart/form-data"
            className="flex flex-col gap-3"
          >
            <input 
              type="file" 
              name="logo" 
              accept="image/png" 
              required 
              className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-slate-300 dark:hover:file:bg-slate-700 cursor-pointer"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition self-start"
            >
              Upload New Logo
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
