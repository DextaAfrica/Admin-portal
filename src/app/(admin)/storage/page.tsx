"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import {
  FolderOpen,
  Copy,
  Trash2,
  ExternalLink,
  Eye,
  FileText,
  Folder,
  LayoutGrid,
  List,
  RefreshCw,
  Download,
  Search,
  FileSpreadsheet,
  Archive,
  User,
  ShieldCheck,
  Check,
  CheckCircle2,
  HardDrive,
  Filter,
  Sparkles,
  FileCode,
  FileCheck,
} from "lucide-react";
import { FileUploadZone } from "@/components/ui/FileUploadZone";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatBytes, formatDate, formatFileCategory } from "@/lib/utils";

interface StorageAsset {
  id: string;
  bucket: string;
  key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  folder: string;
  createdAt: string;
  uploader?: { fullName: string; email: string };
}

const FOLDER_LABELS: Record<string, string> = {
  all: "All Files",
  personal: "My Dedicated Files",
  documents: "Contracts & Reports",
  media: "Brand Photography",
  blueprints: "Engineering Plans & CAD",
  campaigns: "Email Broadcast Media",
  archives: "Secure Backups & Archives",
  general: "General Corporate",
};

export default function StoragePage() {
  const { copied, success: toastSuccess, error: toastError } = useToast();
  const [assets, setAssets] = React.useState<StorageAsset[]>([]);
  const [stats, setStats] = React.useState({
    totalFiles: 0,
    totalBytes: 0,
    myFilesCount: 0,
    myFilesBytes: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeScope, setActiveScope] = React.useState<"all" | "mine">("all");
  const [activeFolder, setActiveFolder] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [selectedAsset, setSelectedAsset] = React.useState<StorageAsset | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = React.useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const toggleAssetSelect = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedReclaimBytes = React.useMemo(() => {
    const idSet = new Set(selectedAssetIds);
    return assets
      .filter((a) => idSet.has(a.id))
      .reduce((sum, a) => sum + Number(a.fileSize || 0), 0);
  }, [assets, selectedAssetIds]);

  const fetchAssets = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFolder !== "all") params.set("folder", activeFolder);
      if (activeScope === "mine") params.set("scope", "mine");
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/storage/assets?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setAssets(data.assets || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch {
      toastError("Unable to Load", "Could not load your storage documents.");
    } finally {
      setIsLoading(false);
    }
  }, [activeFolder, activeScope, searchQuery, toastError]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssets();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchAssets]);

  const handleUpload = async (file: File) => {
    try {
      // Direct high-reliability upload with zero-trust validation
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", activeFolder === "all" ? (activeScope === "mine" ? "personal" : "general") : activeFolder);

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not complete secure upload.");
      }

      toastSuccess("File Saved to Vault", `${file.name} is encrypted and stored in your enterprise repository.`);
      fetchAssets();
      return true;
    } catch (err: unknown) {
      toastError("Upload Notice", err instanceof Error ? err.message : "Error saving file");
      return false;
    }
  };

  const handleDelete = async (assetId: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/storage/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      const data = await res.json();
      if (res.ok) {
        toastSuccess("File Removed", "Asset successfully purged from storage.");
        setDeleteConfirmId(null);
        if (selectedAsset?.id === assetId) setSelectedAsset(null);
        fetchAssets();
      } else {
        toastError("Purge Notice", data.error || "Could not remove this file.");
      }
    } catch {
      toastError("Connection Issue", "Please verify network connection and try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAssetIds.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/storage/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetIds: selectedAssetIds }),
      });
      const data = await res.json();
      if (res.ok) {
        toastSuccess(
          "Storage Space Reclaimed",
          `Purged ${data.deletedCount || selectedAssetIds.length} file(s) and freed ${formatBytes(
            data.reclaimedBytes || selectedReclaimBytes
          )}.`
        );
        setSelectedAssetIds([]);
        setIsBulkDeleteOpen(false);
        fetchAssets();
      } else {
        toastError("Authorization Notice", data.error || "Could not delete selected files.");
      }
    } catch {
      toastError("Connection Issue", "Please verify network connection and try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const copyUrl = (url: string) => {
    const full = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(full);
    copied("Shareable URL copied to clipboard.");
  };

  const folders = [
    "all",
    "personal",
    "documents",
    "media",
    "blueprints",
    "campaigns",
    "archives",
    "general",
  ];

  const getFileIcon = (mimeType: string, fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (mimeType.startsWith("image/")) {
      return <Eye className="h-5 w-5 text-red-500" />;
    }
    if (mimeType === "application/pdf" || ext === "pdf") {
      return <FileText className="h-5 w-5 text-red-600" />;
    }
    if (ext === "xlsx" || ext === "xls" || ext === "csv") {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    }
    if (ext === "zip" || ext === "rar" || ext === "tar" || ext === "gz") {
      return <Archive className="h-5 w-5 text-amber-500" />;
    }
    if (ext === "dwg" || ext === "dxf") {
      return <FileCode className="h-5 w-5 text-purple-500" />;
    }
    return <FileText className="h-5 w-5 text-slate-400" />;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Enterprise Document Storage & Media Vault
            </h1>
            <Badge variant="crimson">Production Grade</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Dedicated user documents, executive reports, engineering blueprints, and cloud assets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Scope Selector: All vs My Dedicated Files */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-white/[0.05] p-1 border border-slate-200 dark:border-white/10 text-xs">
            <button
              onClick={() => setActiveScope("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeScope === "all"
                  ? "bg-white dark:bg-[#1c1d25] text-red-600 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <HardDrive className="h-3.5 w-3.5" />
              <span>Company Vault</span>
            </button>
            <button
              onClick={() => setActiveScope("mine")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeScope === "mine"
                  ? "bg-white dark:bg-[#1c1d25] text-red-600 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>My Dedicated Files</span>
              {stats.myFilesCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-600/10 text-red-600 font-mono text-[10px]">
                  {stats.myFilesCount}
                </span>
              )}
            </button>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchAssets()}
            leftIcon={<RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
          >
            Refresh
          </Button>

          <div className="flex items-center rounded-xl border border-slate-200 dark:border-white/10 p-1 bg-slate-50 dark:bg-white/[0.03]">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-[#1a1b22] text-red-600 shadow-xs"
                  : "text-slate-400"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg cursor-pointer ${
                viewMode === "list"
                  ? "bg-white dark:bg-[#1a1b22] text-red-600 shadow-xs"
                  : "text-slate-400"
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Enterprise Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Repository Files</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.totalFiles}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all departments</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Volume</p>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
            {formatBytes(stats.totalBytes)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Encrypted cloud storage</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Your Personal Allocation</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.myFilesCount} files
          </p>
          <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">
            {formatBytes(stats.myFilesBytes)} dedicated
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Security & Integrity</p>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Zero-Trust Protected
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Script injection defense active</p>
          </div>
          <Badge variant="success" pulse>
            Live
          </Badge>
        </div>
      </div>

      {/* 3. Upload Zone */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Upload Files, Documents & Blueprints
            </h3>
            <p className="text-xs text-slate-500">
              Supports PDFs, Microsoft Office, Spreadsheets, Images, CAD Blueprints, and Archives up to 50MB.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300">
            Target: <strong className="text-red-600">{FOLDER_LABELS[activeFolder] || activeFolder}</strong>
          </span>
        </div>

        <FileUploadZone
          onUpload={handleUpload}
          folder={activeFolder === "all" ? (activeScope === "mine" ? "personal" : "general") : activeFolder}
          maxSizeMB={50}
        />
      </div>

      {/* 4. Controls: Folder Filter Tabs & Live Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Collection Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {folders.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFolder(f)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeFolder === f
                    ? "bg-red-600 text-white shadow-xs"
                    : "border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121318] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                }`}
              >
                <Folder className="h-3.5 w-3.5" />
                <span>{FOLDER_LABELS[f] || f}</span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by file name or format..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121318] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-red-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Selection Cleanup Bar */}
      {selectedAssetIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50/90 dark:bg-red-950/20 px-4 py-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-red-700 dark:text-red-300">
            <Trash2 className="h-4 w-4" />
            <span>
              {selectedAssetIds.length} file(s) selected ({formatBytes(selectedReclaimBytes)} reclaimable)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => setSelectedAssetIds([])}
              className="text-xs"
            >
              Clear Selection
            </Button>
            <Button
              type="button"
              size="xs"
              variant="danger"
              onClick={() => setIsBulkDeleteOpen(true)}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Delete Selected &amp; Free Space
            </Button>
          </div>
        </div>
      )}

      {/* 5. Files Display (Grid vs List) */}
      {assets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-12 text-center bg-white dark:bg-[#121318]">
          <FolderOpen className="mx-auto h-10 w-10 text-slate-400 mb-2" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            {searchQuery ? "No matching files found" : "No documents in this collection"}
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            {searchQuery
              ? "Try adjusting your search terms or clearing the filter."
              : "Upload your first PDF, spreadsheet, drawing, or presentation above."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => {
            const isImage = asset.mimeType.startsWith("image/");
            return (
              <div
                key={asset.id}
                className={`group relative flex flex-col rounded-2xl border bg-white dark:bg-[#121318] overflow-hidden hover:border-red-500/40 hover:shadow-md transition-all ${
                  selectedAssetIds.includes(asset.id)
                    ? "border-red-500 ring-2 ring-red-500/20"
                    : "border-slate-200/80 dark:border-white/10"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedAssetIds.includes(asset.id)}
                  onChange={() => toggleAssetSelect(asset.id)}
                  title="Select file for bulk cleanup"
                  className="absolute top-2.5 left-2.5 z-10 h-4 w-4 rounded border-slate-300 accent-red-600 cursor-pointer"
                />
                {/* Thumbnail Preview Area */}
                <div
                  onClick={() => setSelectedAsset(asset)}
                  className="flex h-36 w-full items-center justify-center bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.06] overflow-hidden cursor-pointer"
                >
                  {isImage ? (
                    <img
                      src={asset.url}
                      alt={asset.fileName}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 p-4 text-center">
                      {getFileIcon(asset.mimeType, asset.fileName)}
                      <span className="font-mono text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                        {asset.fileName.split(".").pop() || "FILE"}
                      </span>
                    </div>
                  )}
                </div>

                {/* File Information */}
                <div className="p-3.5 space-y-1.5">
                  <p
                    className="text-xs font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-red-600 transition-colors"
                    title={asset.fileName}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    {asset.fileName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{formatBytes(asset.fileSize)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.05] font-semibold">
                      {FOLDER_LABELS[asset.folder] || asset.folder}
                    </span>
                  </div>

                  {asset.uploader && (
                    <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                      <User className="h-3 w-3 shrink-0" />
                      <span>{asset.uploader.fullName}</span>
                    </p>
                  )}

                  {/* Actions Bar */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-white/[0.06] pt-2">
                    <a
                      href={`/api/storage/download?id=${asset.id}`}
                      download
                      title="Download File to Computer"
                      className="rounded-lg p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 cursor-pointer transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => copyUrl(asset.url)}
                      title="Copy Shareable CDN Link"
                      className="rounded-lg p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedAsset(asset)}
                      title="View Detailed Metadata"
                      className="rounded-lg p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(asset.id)}
                      title="Delete File from Vault"
                      className="rounded-lg p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-slate-500 font-bold">
              <tr>
                <th className="px-5 py-3.5">Document Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Format</th>
                <th className="px-5 py-3.5">Size</th>
                <th className="px-5 py-3.5">Uploaded By</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                    <div className="flex items-center gap-2">
                      {getFileIcon(asset.mimeType, asset.fileName)}
                      <span className="truncate cursor-pointer hover:underline" onClick={() => setSelectedAsset(asset)}>
                        {asset.fileName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {FOLDER_LABELS[asset.folder] || asset.folder}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                    {formatFileCategory(asset.mimeType, asset.fileName)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    {formatBytes(asset.fileSize)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {asset.uploader ? asset.uploader.fullName : "System"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                    {formatDate(asset.createdAt)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`/api/storage/download?id=${asset.id}`}
                        download
                        className="p-1.5 text-slate-400 hover:text-emerald-600 cursor-pointer transition-colors"
                        title="Download to Computer"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => copyUrl(asset.url)}
                        className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer transition-colors"
                        title="Copy Shareable Link"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedAsset(asset)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                        title="View Metadata"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(asset.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer transition-colors"
                        title="Purge File"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: Complete Asset Metadata & Inspection Modal */}
      <Modal
        isOpen={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
        title="Enterprise Document Details"
        description="Encrypted metadata, zero-trust verification and storage reference"
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => selectedAsset && setDeleteConfirmId(selectedAsset.id)}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Purge from Vault
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => selectedAsset && copyUrl(selectedAsset.url)}
                leftIcon={<Copy className="h-3.5 w-3.5" />}
              >
                Copy CDN Link
              </Button>
              {selectedAsset && (
                <a
                  href={`/api/storage/download?id=${selectedAsset.id}`}
                  download
                >
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                    leftIcon={<Download className="h-3.5 w-3.5" />}
                  >
                    Download File
                  </Button>
                </a>
              )}
            </div>
          </div>
        }
      >
        {selectedAsset && (
          <div className="space-y-4 text-xs">
            {/* Visual Preview if Image */}
            {selectedAsset.mimeType.startsWith("image/") && (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 max-h-56 bg-slate-950 flex items-center justify-center">
                <img
                  src={selectedAsset.url}
                  alt={selectedAsset.fileName}
                  className="max-h-56 w-auto object-contain"
                />
              </div>
            )}

            <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-2">
                <span className="font-semibold text-slate-500">File Name:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-xs">
                  {selectedAsset.fileName}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-2">
                <span className="font-semibold text-slate-500">Collection / Category:</span>
                <span className="font-semibold text-red-600">
                  {FOLDER_LABELS[selectedAsset.folder] || selectedAsset.folder}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-2">
                <span className="font-semibold text-slate-500">File Size:</span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {formatBytes(selectedAsset.fileSize)} ({selectedAsset.fileSize.toLocaleString()} bytes)
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-2">
                <span className="font-semibold text-slate-500">Content Type:</span>
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  {selectedAsset.mimeType}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-2">
                <span className="font-semibold text-slate-500">Uploaded By:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedAsset.uploader ? `${selectedAsset.uploader.fullName} (${selectedAsset.uploader.email})` : "System Service"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-2">
                <span className="font-semibold text-slate-500">Date Added:</span>
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  {formatDate(selectedAsset.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Vault Reference Key:</span>
                <span className="font-mono text-[10px] text-slate-400 truncate max-w-xs">
                  {selectedAsset.key}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px]">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>
                <strong>Zero-Trust Scanned:</strong> Validated against MIME mismatches, path traversal, and malicious script payload signatures.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm File Removal"
        description="Permanently purge this document from your cloud storage vault"
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Permanently Delete
            </Button>
          </div>
        }
      >
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Are you sure you want to delete this file? This will permanently erase the object from Cloudflare R2 / S3 storage and cannot be undone.
        </p>
      </Modal>

      {/* Bulk Delete & Space Reclamation Modal */}
      <Modal
        isOpen={isBulkDeleteOpen}
        onClose={() => !isDeleting && setIsBulkDeleteOpen(false)}
        title={`Delete ${selectedAssetIds.length} Selected File(s)?`}
        description={`Reclaim ${formatBytes(selectedReclaimBytes)} from your Cloudflare R2 / S3 storage vault`}
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={() => setIsBulkDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleBulkDelete}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Purge &amp; Reclaim Space
            </Button>
          </div>
        }
      >
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Only files you uploaded (or all files if you are an Administrator) will be deleted. Unauthorized deletion attempts are blocked and logged.
        </p>
      </Modal>
    </div>
  );
}
