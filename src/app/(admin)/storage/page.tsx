"use client";

import * as React from "react";
import {
  HardDrive,
  Copy,
  Trash2,
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
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
import { formatBytes, formatDate } from "@/lib/utils";

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
      toastError("Error", "Could not fetch assets");
    } finally {
      setIsLoading(false);
    }
  }, [activeFolder, toastError]);

  React.useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleUpload = async (file: File) => {
    try {
      // 1. Get presigned upload URL
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
      if (!presignRes.ok) throw new Error(presignData.error || "Failed to generate upload URL");

      // 2. Upload file binary directly
      const uploadRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Upload streaming failed");

      toastSuccess("Asset Uploaded", `${file.name} saved successfully.`);
      fetchAssets();
      return true;
    } catch (err: unknown) {
      toastError("Upload Failed", err instanceof Error ? err.message : "Error uploading file");
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
        toastSuccess("Asset Deleted", "File removed from storage.");
        setDeleteConfirmId(null);
        fetchAssets();
      } else {
        toastError("Delete Failed", "Could not delete asset");
      }
    } catch {
      toastError("Error", "Network error");
    }
  };

  const copyUrl = (url: string) => {
    const full = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(full);
    copied("S3 Link Copied to Clipboard!");
  };

  const folders = ["all", "general", "campaigns", "documents", "branding"];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header & Storage Quota Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            AWS S3 Cloud Storage Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            High-speed presigned uploads, asset explorer, and cloud bucket telemetry
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

          <div className="flex items-center rounded-lg border border-slate-200 dark:border-white/10 p-0.5 bg-slate-50 dark:bg-white/[0.03]">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md ${viewMode === "grid" ? "bg-white dark:bg-[#1a1b22] text-red-600 shadow-xs" : "text-slate-400"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-white dark:bg-[#1a1b22] text-red-600 shadow-xs" : "text-slate-400"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Storage Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Cloud Files</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-white">{stats.totalFiles}</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Storage Consumed</p>
          <p className="mt-1 font-mono text-2xl font-bold text-red-600 dark:text-rose-400">{formatBytes(stats.totalBytes)}</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Bucket Identifier</p>
          <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white truncate">
            {process.env.NEXT_PUBLIC_AWS_BUCKET || "dexta-assets-storage"}
          </p>
          <Badge variant="success" pulse className="mt-1 text-[10px]">Ready</Badge>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Direct S3 Upload</h3>
        <FileUploadZone onUpload={handleUpload} folder={activeFolder === "all" ? "general" : activeFolder} />
      </div>

      {/* Folder Navigator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {folders.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFolder(f)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              activeFolder === f
                ? "bg-red-600 text-white shadow-sm shadow-red-500/20"
                : "border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            }`}
          >
            <Folder className="h-3.5 w-3.5" />
            <span>{f}</span>
          </button>
        ))}
      </div>

      {/* Asset Explorer Display */}
      {assets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-12 text-center bg-white dark:bg-[#121217]">
          <HardDrive className="mx-auto h-8 w-8 text-slate-400" />
          <h4 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">No files in this bucket folder</h4>
          <p className="mt-1 text-xs text-slate-500">Upload your first image, document, or archive above.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => {
            const isImage = asset.mimeType.startsWith("image/");
            return (
              <div
                key={asset.id}
                className="group relative flex flex-col rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] overflow-hidden hover:border-red-500/30 hover:shadow-md transition-all"
              >
                {/* Thumbnail / Icon container */}
                <div className="flex h-36 w-full items-center justify-center bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.06] overflow-hidden">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.url}
                      alt={asset.fileName}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <FileText className="h-10 w-10 text-slate-400 group-hover:text-red-600 transition-colors" />
                  )}
                </div>

                <div className="p-3">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={asset.fileName}>
                    {asset.fileName}
                  </p>
                  <p className="mt-0.5 text-[10px] font-mono text-slate-500">
                    {formatBytes(asset.fileSize)} &bull; {asset.folder}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-white/[0.06] pt-2">
                    <button
                      onClick={() => copyUrl(asset.url)}
                      title="Copy S3 Link"
                      className="rounded p-1 text-slate-400 hover:text-red-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedAsset(asset)}
                      title="Inspect"
                      className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(asset.id)}
                      title="Delete"
                      className="rounded p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
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
        <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] uppercase font-mono text-slate-400">
              <tr>
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3">Folder</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white truncate max-w-xs">
                    {asset.fileName}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">/{asset.folder}</td>
                  <td className="px-4 py-3 font-mono">{formatBytes(asset.fileSize)}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{formatDate(asset.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => copyUrl(asset.url)} className="p-1 text-slate-400 hover:text-red-600">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirmId(asset.id)} className="p-1 text-slate-400 hover:text-red-600">
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

      {/* Asset Preview Modal */}
      <Modal
        isOpen={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
        title="Asset Preview & S3 URI"
        maxWidth="lg"
      >
        {selectedAsset && (
          <div className="space-y-4">
            {selectedAsset.mimeType.startsWith("image/") && (
              <div className="max-h-80 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center bg-slate-50 dark:bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedAsset.url} alt={selectedAsset.fileName} className="max-h-80 object-contain" />
              </div>
            )}
            <div className="space-y-2 text-xs">
              <p><strong className="text-slate-400 font-mono">Key:</strong> <code className="font-mono">{selectedAsset.key}</code></p>
              <p><strong className="text-slate-400 font-mono">Size:</strong> {formatBytes(selectedAsset.fileSize)}</p>
              <p><strong className="text-slate-400 font-mono">Bucket:</strong> {selectedAsset.bucket}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
              <Button size="sm" variant="secondary" onClick={() => copyUrl(selectedAsset.url)} leftIcon={<Copy className="h-3.5 w-3.5" />}>
                Copy Link
              </Button>
              <a href={selectedAsset.url} target="_blank" rel="noreferrer">
                <Button size="sm" variant="primary" leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                  Open Direct
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
        title="Confirm Asset Deletion"
        description="Are you sure you want to permanently delete this file from S3? This action cannot be reversed."
        footer={
          <>
            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button size="sm" variant="danger" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Permanently Delete
            </Button>
          </>
        }
      >
        <div className="rounded-lg bg-red-50 dark:bg-red-500/10 p-3 border border-red-200 dark:border-red-500/20 text-xs text-red-700 dark:text-rose-400">
          The file will be purged from the S3 bucket and all public links will stop functioning.
        </div>
      </Modal>
    </div>
  );
}

