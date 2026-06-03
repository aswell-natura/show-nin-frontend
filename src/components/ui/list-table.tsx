import { type CSSProperties, type HTMLAttributes } from "react";
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
  align?: "left" | "center" | "right";
  draggable?: boolean;
}

export function ListTableSurface({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/50 bg-card shadow-none ring-1 ring-foreground/10 transition-shadow duration-200",
        className,
      )}
      {...props}
    />
  );
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
  const isDraggable = column.draggable ?? true;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, disabled: !isDraggable });

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
        "relative whitespace-nowrap bg-transparent px-4 py-3.5 text-[11px] font-bold text-muted-foreground/75 tracking-wider uppercase border-b border-border/50",
        isDragging && "bg-background/90 backdrop-blur-md shadow-lg border-x border-y border-border/60 z-30",
        isSortable && "cursor-pointer transition-colors hover:text-foreground",
      )}
      onClick={() => isSortable && onSort(column.id)}
    >
      <div className={cn(
        "flex items-center gap-1.5",
        column.align === "center" && "justify-center",
        column.align === "right" && "justify-end",
      )}>
        {isDraggable && (
          <button
            type="button"
            className="-ml-1 flex h-5 w-4 cursor-grab items-center justify-center rounded text-muted-foreground/30 transition-colors hover:bg-muted hover:text-muted-foreground active:cursor-grabbing"
            onClick={(event) => event.stopPropagation()}
            aria-label={`${column.label}列を並べ替え`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3 w-3" />
          </button>
        )}
        <span>{column.label}</span>
        {isSortable && (
          <span className="shrink-0 ml-0.5">
            {sortKey === column.id ? (
              sortOrder === "asc" ? (
                <ArrowDownAZ className="h-3 w-3 text-primary" />
              ) : (
                <ArrowUpZA className="h-3 w-3 text-primary" />
              )
            ) : (
              <ArrowUpDown className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
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
