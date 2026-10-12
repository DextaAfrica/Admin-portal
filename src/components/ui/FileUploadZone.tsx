"use client";

import * as React from "react";
import { UploadCloud, File, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { Button } from "./Button";
import { formatBytes, cn } from "@/lib/utils";

export interface FileUploadZoneProps {
  onFileSelect?: (file: File) => void;
  onUpload?: (file: File) => Promise<boolean>;
  acceptedMimeTypes?: string[];
  maxSizeMB?: number;
  folder?: string;
}

export function FileUploadZone({
  onFileSelect,
  onUpload,
  acceptedMimeTypes = ["image/*", "application/pdf", "text/*"],
  maxSizeMB = 50,
  folder = "general",
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndSetFile = (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`File exceeds ${maxSizeMB}MB limit`);
      setStatus("error");
      return false;
    }
    setErrorMessage(null);
    setStatus("idle");
    setSelectedFile(file);
    if (onFileSelect) onFileSelect(file);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile || !onUpload) return;
    setIsUploading(true);
    setProgress(20);
    try {
      const timer = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 200);

      const ok = await onUpload(selectedFile);
      clearInterval(timer);

      if (ok) {
        setProgress(100);
        setStatus("success");
        setTimeout(() => {
          setSelectedFile(null);
          setStatus("idle");
          setProgress(0);
        }, 2000);
      } else {
        setStatus("error");
        setErrorMessage("Upload failed. Check storage credentials.");
      }
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Upload error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer",
          isDragging
            ? "border-red-500 bg-red-50/60 dark:bg-rose-500/10 scale-[1.01]"
            : "border-slate-200/90 dark:border-white/10 bg-slate-50/40 dark:bg-[#121217]/50 hover:border-red-500/40 hover:bg-slate-50/80 dark:hover:bg-white/[0.02]"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={acceptedMimeTypes.join(",")}
        />

        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10 text-red-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
          <UploadCloud className="h-7 w-7" />
        </div>

        <h4 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
          Drop your files here to upload to S3, or{" "}
          <span className="text-red-600 dark:text-rose-400 underline">browse</span>
        </h4>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Folder: <code className="font-mono text-red-600 dark:text-rose-400">/{folder}</code> &bull; Up to {maxSizeMB}MB
        </p>
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161c] p-3.5 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300">
              <File className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-xs">
                {selectedFile.name}
              </p>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {formatBytes(selectedFile.size)} &bull; {selectedFile.type || "file"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status === "success" && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Uploaded
              </span>
            )}
            {status === "error" && (
              <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                <AlertCircle className="h-4 w-4" /> {errorMessage || "Failed"}
              </span>
            )}
            {!isUploading && status !== "success" && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUploadClick();
                  }}
                >
                  Upload to S3
                </Button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
            {isUploading && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                <span className="font-mono text-xs text-slate-500">{progress}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

