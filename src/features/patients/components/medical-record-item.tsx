import { MedicalRecord } from "@prisma/client";

export function MedicalRecordItem({ record }: { record: MedicalRecord }) {
  const isPaper = record.source === "paper_import";

  return (
    <div className={`border-l-4 ${isPaper ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20" : "border-blue-500 bg-slate-50 dark:bg-slate-800"} p-4 rounded-r-md`}>
      <div className="flex justify-between items-start mb-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          isPaper ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        }`}>
          {isPaper ? "Paper Import" : "System Entry"}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {record.originalDate ? record.originalDate.toLocaleDateString() : record.createdAt.toLocaleDateString()}
        </span>
      </div>

      {/* Vitals Section */}
      {(record.bp || record.heartRate || record.temp || record.weight) && (
        <div className="flex flex-wrap gap-3 mb-4 p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-xs">
          {record.bp && <div><span className="text-slate-500">BP:</span> <strong className="text-slate-700 dark:text-slate-300">{record.bp}</strong></div>}
          {record.heartRate && <div><span className="text-slate-500">HR:</span> <strong className="text-slate-700 dark:text-slate-300">{record.heartRate} bpm</strong></div>}
          {record.temp && <div><span className="text-slate-500">Temp:</span> <strong className="text-slate-700 dark:text-slate-300">{record.temp} C</strong></div>}
          {record.weight && <div><span className="text-slate-500">Wt:</span> <strong className="text-slate-700 dark:text-slate-300">{record.weight} kg</strong></div>}
        </div>
      )}

      {/* SOAP Notes Section */}
      {(record.subjective || record.objective || record.assessment || record.plan) ? (
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {record.subjective && <div><span className="font-semibold text-slate-900 dark:text-slate-100 block">Subjective:</span> {record.subjective}</div>}
          {record.objective && <div><span className="font-semibold text-slate-900 dark:text-slate-100 block">Objective:</span> {record.objective}</div>}
          {record.assessment && <div><span className="font-semibold text-slate-900 dark:text-slate-100 block">Assessment:</span> {record.assessment}</div>}
          {record.plan && <div><span className="font-semibold text-slate-900 dark:text-slate-100 block">Plan:</span> {record.plan}</div>}
        </div>
      ) : (
        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{record.content}</p>
      )}

      {record.attachments && (
        <div className="mt-3 text-xs">
          <a href={record.attachments} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
            View Attachment &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
