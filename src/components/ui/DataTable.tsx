"use client";

import * as React from "react";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, X, Inbox } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKey?: keyof T;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  bulkActions?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateAction?: React.ReactNode;
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  searchPlaceholder = "Search records... (Press / to search)",
  searchKey,
  pageSize = 10,
  onRowClick,
  bulkActions,
  emptyStateTitle = "No records found",
  emptyStateDescription = "Get started by creating or importing records.",
  emptyStateAction,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<Set<string | number>>(new Set());
  const [sortKey, setSortKey] = React.useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Global '/' keyboard shortcut to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered data
  const filteredData = React.useMemo(() => {
    if (!searchTerm || !searchKey) return data;
    return data.filter((item) => {
      const val = item[searchKey];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm, searchKey]);

  // Sorted data
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const res = aVal < bVal ? -1 : 1;
      return sortOrder === "asc" ? res : -res;
    });
  }, [filteredData, sortKey, sortOrder]);

  // Paginated data
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
    } else {
      const all = new Set<string | number>();
      paginatedData.forEach((item) => {
        if (item.id !== undefined) all.add(item.id);
      });
      setSelectedIds(all);
    }
  };

  const toggleSelectRow = (id: string | number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSort = (key?: keyof T) => {
    if (!key) return;
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input
            ref={searchInputRef}
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="h-4 w-4" />}
            rightIcon={
              searchTerm ? (
                <button
                  onClick={() => setSearchTerm("")}
                  className="hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="text-[10px] font-mono border rounded px-1.5 py-0.5 text-slate-400 dark:border-white/10">
                  /
                </span>
              )
            }
          />
        </div>

        {selectedIds.size > 0 && bulkActions && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 border border-rose-200 dark:border-rose-500/20 animate-fade-in">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
              {selectedIds.size} selected
            </span>
            <div className="h-4 w-px bg-rose-200 dark:bg-rose-500/30" />
            {bulkActions}
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      paginatedData.length > 0 && selectedIds.size === paginatedData.length
                    }
                    onChange={toggleSelectAll}
                    className="h-3.5 w-3.5 rounded border-slate-300 accent-red-600"
                  />
                </th>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={cn(
                      "px-4 py-3 font-semibold",
                      col.sortable && "cursor-pointer select-none hover:text-slate-900 dark:hover:text-white"
                    )}
                    onClick={() => col.sortable && handleSort(col.accessorKey)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                      <div className="rounded-full bg-slate-100 dark:bg-white/[0.05] p-3 text-slate-400">
                        <Inbox className="h-6 w-6" />
                      </div>
                      <h4 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                        {emptyStateTitle}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 text-center">
                        {emptyStateDescription}
                      </p>
                      {emptyStateAction && <div className="mt-4">{emptyStateAction}</div>}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rIdx) => {
                  const isSelected = row.id !== undefined && selectedIds.has(row.id);
                  return (
                    <tr
                      key={row.id ? String(row.id) : rIdx}
                      className={cn(
                        "group transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02]",
                        isSelected && "bg-rose-50/60 dark:bg-rose-500/[0.06]",
                        onRowClick && "cursor-pointer"
                      )}
                      onClick={() => onRowClick && onRowClick(row)}
                    >
                      <td
                        className="px-4 py-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (row.id !== undefined) toggleSelectRow(row.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-3.5 w-3.5 rounded border-slate-300 accent-red-600"
                        />
                      </td>
                      {columns.map((col, cIdx) => (
                        <td key={cIdx} className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {col.cell
                            ? col.cell(row)
                            : col.accessorKey
                            ? String(row[col.accessorKey] ?? "—")
                            : "—"}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {sortedData.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-white/[0.08] px-4 py-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/30 dark:bg-transparent">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {Math.min(currentPage * pageSize, sortedData.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {sortedData.length}
              </span>{" "}
              records
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="xs"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2 font-mono text-xs font-medium">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="xs"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

