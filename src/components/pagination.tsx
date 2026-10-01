import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  baseUrl,
  searchQuery
}: {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  baseUrl: string;
  searchQuery?: string;
}) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  
  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (page > 1) params.set("page", page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 sm:px-6">
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {currentPage > 1 ? (
              <Link
                href={buildUrl(currentPage - 1)}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </Link>
            ) : (
              <button disabled className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-300 dark:text-slate-600 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:z-20 focus:outline-offset-0">
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
            
            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:z-20 focus:outline-offset-0">
              Page {currentPage} of {totalPages}
            </span>

            {currentPage < totalPages ? (
              <Link
                href={buildUrl(currentPage + 1)}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            ) : (
              <button disabled className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-300 dark:text-slate-600 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:z-20 focus:outline-offset-0">
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
