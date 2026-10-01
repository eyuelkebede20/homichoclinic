export function PrintHeader({ title, subtitle }: { title: string, subtitle?: string }) {
  return (
    <div className="hidden print:block w-full mb-8">
      <div className="text-center border-b-2 border-slate-900 pb-4">
        <h1 className="text-3xl font-extrabold uppercase tracking-widest text-black">Homicho Clinic</h1>
        <p className="text-slate-800 font-bold text-lg mt-1">{title}</p>
        {subtitle && <p className="text-slate-600 text-sm mt-1">{subtitle}</p>}
        <p className="text-slate-500 text-xs mt-2 font-mono">Date Printed: {new Date().toLocaleString()}</p>
      </div>
      <div className="fixed bottom-0 left-0 w-full text-center border-t border-slate-300 pt-2 pb-4 text-xs text-slate-500 bg-white">
        Confidential Medical Document - Homicho Ammunition Engineering Industry Clinic
      </div>
    </div>
  );
}
