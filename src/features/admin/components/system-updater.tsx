"use client";

import { useEffect, useRef, useState } from "react";
import { triggerSystemUpdate } from "@/features/admin/actions";
import {
  DownloadCloud,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Terminal,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | "idle"
  | "requesting"   // writing flag file
  | "running"      // update.sh is running — poll /api/update-status
  | "restarting"   // container restarted — poll /api/health
  | "done"
  | "failed";

// ─── Constants ────────────────────────────────────────────────────────────────

/** How often to poll update-status while the script is running */
const STATUS_POLL_MS = 2_000;
/** How often to poll /health after the container restarts */
const HEALTH_POLL_MS = 4_000;
/** How long to wait for the whole thing before giving up */
const TOTAL_TIMEOUT_MS = 5 * 60_000; // 5 min

// ─── Component ────────────────────────────────────────────────────────────────

export function SystemUpdater() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [logLines, setLogLines] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef(false); // abort signal for poll loops

  // Auto-scroll the log pane
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [logLines]);

  // Clean up on unmount
  useEffect(() => () => { stopRef.current = true; }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const appendLog = (line: string) =>
    setLogLines((prev) => [...prev, line]);

  const sleep = (ms: number) =>
    new Promise<void>((r) => setTimeout(r, ms));

  // ── Main handler ──────────────────────────────────────────────────────────

  const handleUpdate = async () => {
    if (
      !confirm(
        "Pull the latest code and rebuild?\n\n" +
        "The app will restart automatically (~2 min). " +
        "Make sure you have a recent database backup."
      )
    ) return;

    stopRef.current = false;
    setLogLines([]);
    setPhase("requesting");

    // 1. Write the flag file via the server action
    try {
      const res = await triggerSystemUpdate({});
      if (!res?.data?.success) {
        appendLog("✗ " + (res?.error ?? "Could not trigger update"));
        setPhase("failed");
        return;
      }
      appendLog("✓ Update request sent — Task Scheduler will now run update.bat");
    } catch (err: any) {
      appendLog("✗ " + err.message);
      setPhase("failed");
      return;
    }

    // 2. Poll /api/update-status while the script is running
    setPhase("running");
    const deadline = Date.now() + TOTAL_TIMEOUT_MS;
    let seenLines = 0;
    let scriptDone = false;
    let scriptFailed = false;

    while (!stopRef.current && Date.now() < deadline) {
      await sleep(STATUS_POLL_MS);
      try {
        const r = await fetch("/api/update-status", { cache: "no-store" });
        if (r.ok) {
          const data: { lines: string[]; done: boolean; failed: boolean } = await r.json();
          // Append only newly added lines
          const newLines = data.lines.slice(seenLines);
          if (newLines.length) {
            setLogLines((prev) => [...prev, ...newLines]);
            seenLines = data.lines.length;
          }
          if (data.done) {
            scriptDone = true;
            scriptFailed = data.failed;
            break;
          }
        }
      } catch {
        // API may briefly 503 during restart — continue polling
      }
    }

    if (scriptFailed) {
      appendLog("✗ Update rolled back. See log above.");
      setPhase("failed");
      return;
    }

    // 3. Script says done (container restarted) → poll /api/health
    setPhase("restarting");
    appendLog("--- Container is restarting, waiting for it to come back online ---");

    // Give the container a moment to begin restarting
    await sleep(6_000);

    while (!stopRef.current && Date.now() < deadline) {
      try {
        const r = await fetch("/api/health", { cache: "no-store" });
        if (r.ok) {
          appendLog("✅ App is back online.");
          setPhase("done");
          return;
        }
      } catch {
        // Still restarting
      }
      await sleep(HEALTH_POLL_MS);
    }

    if (!scriptDone) {
      appendLog("✗ Timed out waiting for update.bat to finish (5 min). Check server logs.");
    } else {
      appendLog("✗ App did not come back online in time. Check: docker compose logs app");
    }
    setPhase("failed");
  };

  // ── Derived UI state ──────────────────────────────────────────────────────

  const isRunning = phase === "requesting" || phase === "running" || phase === "restarting";

  const phaseLabel: Record<Phase, string> = {
    idle:       "Pull Latest Updates",
    requesting: "Sending request...",
    running:    "Running update.bat...",
    restarting: "Restarting container...",
    done:       "Pull Latest Updates",
    failed:     "Retry Update",
  };

  const statusLabel: Record<Phase, string> = {
    idle:       "",
    requesting: "Writing update flag...",
    running:    "Backing up DB → pulling code → building image",
    restarting: "Waiting for app to come back online...",
    done:       "",
    failed:     "",
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/60 rounded-xl p-6 flex flex-col shadow-sm h-full">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-4">
        <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
          <DownloadCloud className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">System Update</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Pull the latest code, rebuild the image, and restart. The app
          will be down for ~2 minutes. Back up the database first.
        </p>
      </div>

      {/* Live log pane — shown once the process starts */}
      {logLines.length > 0 && (
        <div className="mb-4 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-950 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700 text-xs text-slate-400">
            <Terminal className="w-3.5 h-3.5" />
            <span>update.bat — live output</span>
            {isRunning && <RefreshCw className="w-3 h-3 animate-spin ml-auto" />}
          </div>
          <div
            ref={logRef}
            className="px-3 py-2 text-xs font-mono text-slate-300 max-h-56 overflow-y-auto space-y-0.5"
          >
            {logLines.map((line, i) => (
              <div
                key={i}
                className={
                  line.includes("✅") || line.includes("✓")
                    ? "text-emerald-400"
                    : line.includes("✗") || line.includes("!!")
                    ? "text-red-400"
                    : line.startsWith("---")
                    ? "text-slate-500 italic"
                    : "text-slate-300"
                }
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status pill */}
      {isRunning && statusLabel[phase] && (
        <p className="text-xs text-center text-blue-600 dark:text-blue-400 mb-3 animate-pulse">
          {statusLabel[phase]}
        </p>
      )}

      {/* Done banner */}
      {phase === "done" && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md px-3 py-2 mb-4">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Update complete — the app is back online.
        </div>
      )}

      {/* Failed banner */}
      {phase === "failed" && (
        <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Update failed or timed out. The app may have rolled back. Check the log above.
        </div>
      )}

      {/* Action button */}
      <button
        onClick={handleUpdate}
        disabled={isRunning}
        className="mt-auto w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
      >
        {isRunning ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <DownloadCloud className="w-4 h-4" />
        )}
        {phaseLabel[phase]}
      </button>
    </div>
  );
}
