import { MedicalRecord } from "@prisma/client";
import { formatToEthiopianDate } from "@/lib/date-utils";
import { Stethoscope, Tag, CheckCircle2, FileText, UserCheck } from "lucide-react";

export type MedicalRecordWithAuthor = MedicalRecord & {
  enteredByName?: string | null;
};

export function MedicalRecordItem({ record }: { record: MedicalRecordWithAuthor }) {
  const isPaper = record.source === "paper_import";

  // Extract attending practitioner name if recorded in content or provided via relation
  const contentDocMatch = record.content?.match(/Attending Practitioner:\s*([^\n\r]+)/i);
  const practitioner =
    contentDocMatch?.[1]?.trim() ||
    (record.enteredByName
      ? record.enteredByName.startsWith("Dr.")
        ? record.enteredByName
        : `Dr. ${record.enteredByName}`
      : null);

  // Check if assessment contains multiple diagnoses (separated by ; or ,)
  const isDiagnosisRecord =
    record.content?.includes("Diagnosed Generalized Diseases:") ||
    record.content?.includes("Final Diagnosis:") ||
    (record.assessment && record.assessment.trim().length > 0);

  // Split multiple diagnoses if available
  const parsedDiagnoses: string[] = [];
  if (record.assessment) {
    record.assessment
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .forEach((d) => parsedDiagnoses.push(d));
  }

  // Parse clinical notes if stored in content
  const notesMatch = record.content?.match(/(?:Clinical Notes|Notes):\s*([^\n\r]+)/i);
  const clinicalNotes = notesMatch?.[1]?.trim();

  return (
    <div
      className={`border-l-4 ${
        isPaper
          ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
          : "border-indigo-600 dark:border-indigo-500 bg-slate-50 dark:bg-slate-900/60"
      } p-4 rounded-r-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 transition-all`}
    >
      {/* Top Header: Badge, Attending Practitioner, and Ethiopian Date */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isPaper
                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300"
            }`}
          >
            {isPaper ? "Paper Import" : "System Clinical Record"}
          </span>

          {/* Attending Practitioner Badge */}
          {practitioner && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Stethoscope className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Attending: {practitioner}</span>
            </span>
          )}
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {formatToEthiopianDate(record.originalDate || record.createdAt)}
        </span>
      </div>

      {/* Vitals Section */}
      {(record.bp || record.heartRate || record.temp || record.weight) && (
        <div className="flex flex-wrap gap-3 p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          {record.bp && (
            <div>
              <span className="text-slate-500">BP:</span>{" "}
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{record.bp}</strong>
            </div>
          )}
          {record.heartRate && (
            <div>
              <span className="text-slate-500">HR:</span>{" "}
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{record.heartRate} bpm</strong>
            </div>
          )}
          {record.temp && (
            <div>
              <span className="text-slate-500">Temp:</span>{" "}
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{record.temp} °C</strong>
            </div>
          )}
          {record.weight && (
            <div>
              <span className="text-slate-500">Weight:</span>{" "}
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{record.weight} kg</strong>
            </div>
          )}
        </div>
      )}

      {/* Diagnosed Generalized Diseases Highlight Banner */}
      {parsedDiagnoses.length > 0 && (
        <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-indigo-100 dark:border-indigo-950 space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
            <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Diagnosed Generalized Disease{parsedDiagnoses.length > 1 ? "s" : ""}:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {parsedDiagnoses.map((diag, idx) => {
              // Extract code if format is "[A09] Disease Name"
              const codeMatch = diag.match(/^\[([^\]]+)\]\s*(.*)$/);
              const code = codeMatch ? codeMatch[1] : null;
              const name = codeMatch ? codeMatch[2] : diag;

              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                >
                  {code && (
                    <span className="font-mono text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-black">
                      {code}
                    </span>
                  )}
                  <span>{name}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* SOAP Notes Section */}
      {record.subjective || record.objective || record.plan ? (
        <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
          {record.subjective && (
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100">Subjective: </span>
              {record.subjective}
            </div>
          )}
          {record.objective && (
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100">Objective: </span>
              {record.objective}
            </div>
          )}
          {record.plan && (
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100">Plan / Management: </span>
              {record.plan}
            </div>
          )}
        </div>
      ) : !parsedDiagnoses.length ? (
        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{record.content}</p>
      ) : null}

      {/* Doctor Remarks if separate */}
      {clinicalNotes && (
        <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/40 p-2 rounded-lg">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Doctor Notes: </span>
          {clinicalNotes}
        </div>
      )}

      {/* Attachments */}
      {record.attachments && (
        <div className="pt-1 text-xs">
          <a
            href={record.attachments}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold"
          >
            <FileText className="w-3.5 h-3.5" />
            View Attachment &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
