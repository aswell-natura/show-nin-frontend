import { type CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDownAZ,
  ArrowUpDown,
  ArrowUpZA,
  GripVertical,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";

export type ListSortOrder = "asc" | "desc";

export interface ListTableColumn {
  id: string;
  label: string;
  width: string;
  sortable?: boolean;
}

interface SortableListTableHeadProps {
  column: ListTableColumn;
  sortKey: string;
  sortOrder: ListSortOrder;
  onSort: (key: string) => void;
}

export function SortableListTableHead({
  column,
  sortKey,
  sortOrder,
  onSort,
}: SortableListTableHeadProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  const isSortable = column.sortable ?? true;

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        column.width,
        "relative whitespace-nowrap bg-muted/40 px-4 py-3 text-xs font-bold text-muted-foreground",
        isDragging && "bg-muted shadow-md",
        isSortable && "cursor-pointer transition-colors hover:text-foreground",
      )}
      onClick={() => isSortable && onSort(column.id)}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="-ml-1 flex h-6 w-5 cursor-grab items-center justify-center rounded text-muted-foreground/40 transition-colors hover:bg-background hover:text-muted-foreground active:cursor-grabbing"
          onClick={(event) => event.stopPropagation()}
          aria-label={`${column.label}列を並べ替え`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span>{column.label}</span>
        {isSortable && (
          <span className="shrink-0">
            {sortKey === column.id ? (
              sortOrder === "asc" ? (
                <ArrowDownAZ className="h-3.5 w-3.5 text-primary" />
              ) : (
                <ArrowUpZA className="h-3.5 w-3.5 text-primary" />
              )
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/25" />
            )}
          </span>
        )}
      </div>
    </TableHead>
  );
}

interface ListPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function ListPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: ListPaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-4 px-2 pt-6 sm:flex-row">
      <div className="text-center text-xs font-medium text-muted-foreground sm:text-left">
        全 <span className="font-bold text-foreground">{totalItems}</span>{" "}
        件中{" "}
        <span className="font-bold text-foreground">
          {startItem} - {endItem}
        </span>{" "}
        件を表示
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="h-8 rounded-md px-2.5 text-xs font-medium hover:bg-muted"
        >
          前へ
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "primary" : "ghost"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={cn(
              "h-8 w-8 rounded-md p-0 text-xs font-bold transition-all",
              currentPage === page
                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="h-8 rounded-md px-2.5 text-xs font-medium hover:bg-muted"
        >
          次へ
        </Button>
      </div>
    </div>
  );
}
