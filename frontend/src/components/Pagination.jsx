export function Pagination({ page, pageSize, total, onPageChange, disabled = false }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total <= pageSize) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="pagination-wrap">
      <div className="pagination-controls" aria-label="Paginación de resultados">
        {pages.map((number) => (
          <button
            key={number}
            className={number === page ? "pagination-page active" : "pagination-page"}
            type="button"
            onClick={() => onPageChange(number)}
            disabled={disabled || number === page}
            aria-current={number === page ? "page" : undefined}
          >
            {number}
          </button>
        ))}
      </div>
    </div>
  );
}
