import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MdChevronLeft, MdChevronRight, MdFirstPage, MdLastPage } from 'react-icons/md';

interface TablePaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export function TablePagination({ total, page, pageSize, onPageChange, onPageSizeChange, pageSizeOptions = [10, 20, 50] }: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-3 lg:px-4 py-2 border-t border-border bg-muted/20 gap-2">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="hidden sm:inline">Showing</span> <span>{start}–{end} <span className="hidden sm:inline">of {total}</span></span>
        <Select value={String(pageSize)} onValueChange={(v) => { onPageSizeChange(Number(v)); onPageChange(1); }}>
          <SelectTrigger className="h-6 w-14 text-[11px] rounded-md border-border ml-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hidden sm:inline-flex" disabled={page <= 1} onClick={() => onPageChange(1)}>
          <MdFirstPage className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <MdChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-[11px] font-medium px-1.5 text-muted-foreground">
          {page}/{totalPages}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <MdChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hidden sm:inline-flex" disabled={page >= totalPages} onClick={() => onPageChange(totalPages)}>
          <MdLastPage className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/** Hook to paginate an array */
export function usePagination<T>(items: T[], initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = items.slice((safePage - 1) * pageSize, safePage * pageSize);

  return {
    page: safePage,
    pageSize,
    setPage,
    setPageSize,
    paginatedItems,
    total: items.length,
  };
}
