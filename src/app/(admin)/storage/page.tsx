"use client";

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
  general: "General",
  campaigns: "Email Flyers",
  documents: "Project Reports",
  branding: "Brand Media",
};

export default function StoragePage() {
  const { copied, success: toastSuccess, error: toastError } = useToast();
  const [assets, setAssets] = React.useState<StorageAsset[]>([]);
  const [stats, setStats] = React.useState({ totalFiles: 0, totalBytes: 0 });
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeFolder, setActiveFolder] = React.useState("all");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [selectedAsset, setSelectedAsset] = React.useState<StorageAsset | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  const fetchAssets = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/storage/assets?folder=${activeFolder}`);
      const data = await res.json();
      if (res.ok) {
        setAssets(data.assets || []);
        setStats(data.stats || { totalFiles: 0, totalBytes: 0 });
      }
    } catch {
      toastError("Unable to Load", "Could not load your files.");
    } finally {
      setIsLoading(false);
    }
  }, [activeFolder, toastError]);

  React.useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleUpload = async (file: File) => {
    try {
      const presignRes = await fetch("/api/storage/presign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          folder: activeFolder === "all" ? "general" : activeFolder,
        }),
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error || "Could not prepare file upload");

      const uploadRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Could not complete file transfer");

      toastSuccess("File Saved", `${file.name} has been added to your library.`);
      fetchAssets();
      return true;
    } catch (err: unknown) {
      toastError("Upload Issue", err instanceof Error ? err.message : "Error saving file");
      return false;
    }
  };

  const handleDelete = async (assetId: string) => {
    try {
      const res = await fetch("/api/storage/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      if (res.ok) {
        toastSuccess("File Removed", "The file has been removed from your library.");
        setDeleteConfirmId(null);
        fetchAssets();
      } else {
        toastError("Remove Failed", "Could not remove this file.");
      }
    } catch {
      toastError("Connection Error", "Please check your connection and try again.");
    }
  };

  const copyUrl = (url: string) => {
    const full = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(full);
    copied("Shareable link copied to clipboard!");
  };

  const folders = ["all", "general", "campaigns", "documents", "branding"];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Files & Media Library
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Organize company brochures, project photography, campaign flyers, and shared documents
          </p>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Saved Files</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.totalFiles}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Library Space Used</p>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
            {formatBytes(stats.totalBytes)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Library Status</p>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
              Dexta Africa Media Vault
            </p>
          </div>
          <Badge variant="success" pulse>
            Available
          </Badge>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
          Add New Files or Photography
        </h3>
        <FileUploadZone
          onUpload={handleUpload}
          folder={activeFolder === "all" ? "general" : activeFolder}
        />
      </div>

      {/* Collection Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {folders.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFolder(f)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeFolder === f
                ? "bg-red-600 text-white shadow-xs"
                : "border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121318] text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            }`}
          >
            <Folder className="h-3.5 w-3.5" />
            <span>{FOLDER_LABELS[f] || f}</span>
          </button>
        ))}
      </div>

      {/* Files Display */}
      {assets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-12 text-center bg-white dark:bg-[#121318]">
          <FolderOpen className="mx-auto h-9 w-9 text-slate-400" />
          <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
            No files in this collection yet
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            Upload your first photo, brochure, or document above.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => {
            const isImage = asset.mimeType.startsWith("image/");
            return (
              <div
                key={asset.id}
                className="group relative flex flex-col rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] overflow-hidden hover:border-red-500/30 hover:shadow-md transition-all"
              >
                <div className="flex h-40 w-full items-center justify-center bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.06] overflow-hidden">
                  {isImage ? (
                    <img
                      src={asset.url}
                      alt={asset.fileName}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <FileText className="h-10 w-10 text-slate-400 group-hover:text-red-600 transition-colors" />
                  )}
                </div>

                <div className="p-4">
                  <p
                    className="text-xs font-bold text-slate-900 dark:text-white truncate"
                    title={asset.fileName}
                  >
                    {asset.fileName}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {formatBytes(asset.fileSize)} • {FOLDER_LABELS[asset.folder] || asset.folder}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-white/[0.06] pt-2.5">
                    <button
                      onClick={() => copyUrl(asset.url)}
                      title="Copy Shareable Link"
                      className="rounded-lg p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedAsset(asset)}
                      title="View File Details"
                      className="rounded-lg p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(asset.id)}
                      title="Remove File"
                      className="rounded-lg p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
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
                <th className="px-5 py-3.5">File Name</th>
                <th className="px-5 py-3.5">Collection</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">File Size</th>
                <th className="px-5 py-3.5">Date Added</th>
                <th className="px-5 py-3.5 text-right">Options</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white truncate max-w-xs">
                    {asset.fileName}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {FOLDER_LABELS[asset.folder] || asset.folder}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {formatFileCategory(asset.mimeType, asset.fileName)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {formatBytes(asset.fileSize)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{formatDate(asset.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => copyUrl(asset.url)}
                        className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Copy Link"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(asset.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Remove"
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

      {/* File Preview Modal */}
      <Modal
        isOpen={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
        title={selectedAsset?.fileName || "File Preview"}
        description="View file details or copy its shareable link"
        maxWidth="lg"
      >
        {selectedAsset && (
          <div className="space-y-4">
            {selectedAsset.mimeType.startsWith("image/") && (
              <div className="max-h-80 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center bg-slate-50 dark:bg-black">
                <img
                  src={selectedAsset.url}
                  alt={selectedAsset.fileName}
                  className="max-h-80 object-contain"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] p-4 text-xs">
              <div>
                <p className="text-slate-400">Collection</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {FOLDER_LABELS[selectedAsset.folder] || selectedAsset.folder}
                </p>
              </div>
              <div>
                <p className="text-slate-400">File Size</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatBytes(selectedAsset.fileSize)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Category</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatFileCategory(selectedAsset.mimeType, selectedAsset.fileName)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Date Added</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatDate(selectedAsset.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyUrl(selectedAsset.url)}
                leftIcon={<Copy className="h-3.5 w-3.5" />}
              >
                Copy Shareable Link
              </Button>
              <a href={selectedAsset.url} target="_blank" rel="noreferrer">
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
                >
                  Open File
                </Button>
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Remove File from Library"
        description="Are you sure you want to remove this file from your workspace library?"
        footer={
          <>
            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Remove File
            </Button>
          </>
        }
      >
        <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3.5 border border-red-200 dark:border-red-500/20 text-xs text-red-700 dark:text-red-400">
          Removing this file will delete it from the shared media library so it will no longer appear in shared links.
        </div>
      </Modal>
    </div>
  );
}
