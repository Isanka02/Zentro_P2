interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ page, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const firstVisiblePage = Math.max(2, page - 2);
  const lastVisiblePage = Math.min(totalPages - 1, page + 2);
  const pages: Array<number | "start-ellipsis" | "end-ellipsis"> = [1];
  if (firstVisiblePage > 2) pages.push("start-ellipsis");
  for (let currentPage = firstVisiblePage; currentPage <= lastVisiblePage; currentPage += 1) {
    pages.push(currentPage);
  }
  if (lastVisiblePage < totalPages - 1) pages.push("end-ellipsis");
  pages.push(totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Go to previous page"
        className="px-3 py-1.5 rounded-md border border-gray-300 text-sm disabled:opacity-40"
      >
        Previous
      </button>

      {pages.map((item) => typeof item === "number" ? (
        <button
          key={item}
          onClick={() => onPageChange(item)}
          aria-label={`Page ${item}`}
          aria-current={item === page ? "page" : undefined}
          className={`w-9 h-9 rounded-md text-sm ${
            item === page ? "bg-blue-600 text-white" : "border border-gray-300 hover:bg-gray-50"
          }`}
        >
          {item}
        </button>
      ) : (
        <span key={item} aria-hidden="true" className="px-1 text-gray-500">…</span>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Go to next page"
        className="px-3 py-1.5 rounded-md border border-gray-300 text-sm disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;
