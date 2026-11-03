"use client";

import * as React from "react";
import {
  FileCode2,
  RefreshCw,
  Save,
  CheckCircle2,
  Globe,
  Eye,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import type { ContentPage } from "@/lib/backend-api";

export default function ContentCmsPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [pages, setPages] = React.useState<ContentPage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedKey, setSelectedKey] = React.useState<string>("");

  // Editor Form Fields
  const [activePage, setActivePage] = React.useState<ContentPage | null>(null);
  const [title, setTitle] = React.useState("");
  const [seoTitle, setSeoTitle] = React.useState("");
  const [seoDescription, setSeoDescription] = React.useState("");
  const [published, setPublished] = React.useState(true);
  const [jsonText, setJsonText] = React.useState("");
  const [jsonError, setJsonError] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const fetchPages = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/backend/content");
      if (!res.ok) throw new Error("Could not fetch content pages");
      const json = await res.json();
      const list: ContentPage[] = json.data || [];
      setPages(list);

      // Select first page if none selected
      if (list.length > 0 && !selectedKey) {
        selectPage(list[0]);
      }
    } catch (err: any) {
      toastError("CMS Sync Error", err.message || "Failed to load content pages from Go backend");
    } finally {
      setIsLoading(false);
    }
  }, [selectedKey, toastError]);

  React.useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const selectPage = (p: ContentPage) => {
    setSelectedKey(p.key);
    setActivePage(p);
    setTitle(p.title);
    setSeoTitle(p.seoTitle || "");
    setSeoDescription(p.seoDescription || "");
    setPublished(p.published);
    setJsonText(JSON.stringify(p.content || {}, null, 2));
    setJsonError("");
  };

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    try {
      JSON.parse(val);
      setJsonError("");
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePage) return;

    let parsedContent = {};
    try {
      parsedContent = JSON.parse(jsonText);
    } catch {
      toastError("Invalid JSON", "Please fix JSON syntax errors before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content: parsedContent,
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        published,
      };

      const res = await fetch(`/api/backend/content/${activePage.key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Save operation failed");
      }

      toastSuccess(
        "Page Content Published",
        `${activePage.key} content synchronized with backend and cache revalidation triggered.`
      );

      // Update local state
      const updated: ContentPage = {
        ...activePage,
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      setActivePage(updated);
      setPages((prev) => prev.map((p) => (p.key === updated.key ? updated : p)));
    } catch (err: any) {
      toastError("Save Failed", err.message || "Could not save page content");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Editorial CMS &amp; Page Builder
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              Go Core API
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Author and orchestrate the dynamic JSON schemas powering the public luxury website across Africa.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchPages()}
            leftIcon={<RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
          >
            Sync Pages
          </Button>
          {activePage && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleSavePage}
              isLoading={isSaving}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Publish Changes
            </Button>
          )}
        </div>
      </div>

      {/* Main CMS Layout: Left Page Selector, Right Visual Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Page List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] p-3 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
              Website Pages ({pages.length})
            </h2>

            <div className="space-y-1">
              {pages.map((p) => {
                const isSelected = p.key === selectedKey;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => selectPage(p)}
                    className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 text-[#ED2618] font-bold"
                        : "hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Globe
                        className={`h-4 w-4 shrink-0 ${
                          isSelected ? "text-[#ED2618]" : "text-slate-400"
                        }`}
                      />
                      <div className="truncate">
                        <p className="truncate font-semibold">{p.title || p.key}</p>
                        <p className="text-[10px] text-slate-400 font-mono">/{p.key}</p>
                      </div>
                    </div>

                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        p.published ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                      title={p.published ? "Published" : "Draft"}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 8 Cols: Content Editor */}
        <div className="lg:col-span-8">
          {activePage ? (
            <form onSubmit={handleSavePage} className="space-y-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Editing: {activePage.title}
                    </h2>
                    <span className="font-mono text-xs rounded bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-slate-600 dark:text-slate-300">
                      key: {activePage.key}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Last modified {formatDate(activePage.updatedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      className="h-4 w-4 rounded text-red-600 focus:ring-red-500"
                    />
                    <span className={published ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}>
                      {published ? "Live on Web" : "Draft Mode"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Title & SEO Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Editorial Page Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <Input
                  label="SEO Meta Title"
                  placeholder="Page Title | Dexta Africa"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  SEO Meta Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Primary search engine synopsis for Google and social previews..."
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              {/* Dynamic JSON Schema Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-[#ED2618]" />
                    Page JSON Content Payload
                  </label>
                  {jsonError ? (
                    <span className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Syntax error in JSON
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Valid JSON
                    </span>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    rows={16}
                    value={jsonText}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    className="w-full font-mono text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-950 text-emerald-400 p-4 focus:outline-none focus:ring-1 focus:ring-red-500 leading-relaxed"
                    spellCheck={false}
                  />
                </div>
                {jsonError && (
                  <p className="text-xs text-red-500 font-mono bg-red-50 dark:bg-red-500/10 p-2 rounded-lg border border-red-200 dark:border-red-500/20">
                    {jsonError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                <p className="text-[11px] text-slate-400">
                  Saving automatically triggers Next.js On-Demand Revalidation on the public website.
                </p>
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  isLoading={isSaving}
                  disabled={Boolean(jsonError)}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Publish &amp; Revalidate
                </Button>
              </div>
            </form>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-12 text-center">
              <FileCode2 className="mx-auto h-8 w-8 text-slate-400" />
              <p className="text-xs text-slate-500 mt-2">
                Select a page from the list to view and edit its content.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

