"use client";

export function PrintActions() {
  return (
    <div className="mt-8 text-center no-print">
      <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded">
        Print Receipt
      </button>
      <button onClick={() => window.close()} className="ml-4 text-gray-600 hover:underline">
        Close Window
      </button>
    </div>
  );
}
