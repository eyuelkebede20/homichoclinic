"use client";

import { useState, useRef } from "react";
import { createMedicalRecord } from "../actions";
import { Loader2, ScanText } from "lucide-react";
import { useRouter } from "next/navigation";
import Tesseract from "tesseract.js";
import { toast } from "sonner";

interface PaperImportFormProps {
  patientId: string;
}

export function PaperImportForm({ patientId }: PaperImportFormProps) {
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [source, setSource] = useState<"system" | "paper_import">("system");
  
  const formRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setSource("paper_import");
    try {
      const result = await Tesseract.recognize(file, 'eng');
      setContent((prev) => (prev ? prev + "\n" + result.data.text : result.data.text));
    } catch (err) {
      console.error(err);
      toast.error("Failed to run OCR on image.");
    } finally {
      setOcrLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const rawAttachments = formData.get("attachments");
    const rawOriginalDate = formData.get("originalDate");
    
    const result = await createMedicalRecord({
      patientId,
      source,
      originalDate: source === "paper_import" && typeof rawOriginalDate === "string" && rawOriginalDate.trim() ? rawOriginalDate.trim() : undefined,
      content: content,
      attachments: typeof rawAttachments === "string" && rawAttachments.trim() ? rawAttachments.trim() : undefined,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setContent("");
      // Fast reset for keyboard-friendly bulk entry
      formRef.current?.reset();
      firstInputRef.current?.focus();
      router.refresh();
      
      setTimeout(() => setSuccess(false), 2000);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Add Clinical Note / Record</h3>
        
        {/* OCR Button directly uses file input */}
        <label className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
          {ocrLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ScanText className="w-4 h-4 mr-2" />}
          {ocrLoading ? "Scanning..." : "Browser OCR Scan"}
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={ocrLoading} />
        </label>
      </div>
      
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
        {success && <div className="text-sm text-green-600 dark:text-green-400">Record imported successfully. Ready for next.</div>}

        <div className="flex gap-4 mb-2">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="radio" checked={source === "system"} onChange={() => setSource("system")} className="accent-blue-600" />
            Live System Note
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="radio" checked={source === "paper_import"} onChange={() => setSource("paper_import")} className="accent-blue-600" />
            Historical Paper Import
          </label>
        </div>

        {source === "paper_import" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Original Record Date</label>
              <input 
                ref={firstInputRef}
                required
                name="originalDate" 
                type="date" 
                className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Attachment URL (Optional)</label>
            <input 
              name="attachments" 
              type="url"
              placeholder="https://..."
              className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </div>
          </div>
        )}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Clinical Notes / Content</label>
          </div>
          
          {/* Quick Symptoms Pills */}
          <div className="flex flex-wrap gap-2 mb-2">
            {["Headache", "Stomachache", "Dizziness", "Fever", "Cough", "Nausea", "Fatigue", "Back Pain"].map(symp => (
              <button
                key={symp}
                type="button"
                onClick={() => setContent(prev => prev ? `${prev.trim()}, ${symp}` : symp)}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50 transition-colors border border-blue-200 dark:border-blue-800"
              >
                + {symp}
              </button>
            ))}
          </div>

          <textarea 
            required
            name="content" 
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Transcribe paper record or enter live clinical notes here..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Clinical Note
        </button>
      </form>
    </div>
  );
}
