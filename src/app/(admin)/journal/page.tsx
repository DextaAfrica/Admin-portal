"use client";

import * as React from "react";
import {
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  Edit3,
  Trash2,
  Calendar,
  User,
  Tag,
  Globe,
  Star,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import type { Article } from "@/lib/backend-api";

export default function JournalPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [articles, setArticles] = React.useState<Article[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");

  // Modal State
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Article | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] =
    React.useState<Article | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form Fields
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [author, setAuthor] = React.useState("");
  const [category, setCategory] = React.useState("Market Insights");
  const [coverImageUrl, setCoverImageUrl] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [published, setPublished] = React.useState(true);
  const [seoTitle, setSeoTitle] = React.useState("");
  const [seoDescription, setSeoDescription] = React.useState("");

  const fetchArticles = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/backend/journal?perPage=50");
      if (!res.ok) throw new Error("Could not fetch journal articles");
      const json = await res.json();
      setArticles(json.data || []);
    } catch (err: any) {
      toastError("Journal Sync Error", err.message || "Failed to load articles from Go backend");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  React.useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle("");
    setSlug("");
    setAuthor("Dexta Editorial Board");
    setCategory("Market Insights");
    setCoverImageUrl("");
    setExcerpt("");
    setPublished(true);
    setSeoTitle("");
    setSeoDescription("");
    setIsFormOpen(true);
  };

  const openEditModal = (article: Article) => {
    setEditingItem(article);
    setTitle(article.title);
    setSlug(article.slug);
    setAuthor(article.author || "");
    setCategory(article.category || "Market Insights");
    setCoverImageUrl(article.coverImageUrl || "");
    setExcerpt(article.excerpt || "");
    setPublished(article.published);
    setSeoTitle(article.seoTitle || "");
    setSeoDescription(article.seoDescription || "");
    setIsFormOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingItem) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      toastError("Validation Error", "Title and URL Slug are required");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      author: author.trim(),
      category: category.trim(),
      coverImageUrl: coverImageUrl.trim(),
      excerpt: excerpt.trim(),
      body: editingItem?.body || {
        sections: [
          { type: "paragraph", content: excerpt.trim() || "Full editorial piece..." },
        ],
      },
      published,
      seoTitle: seoTitle.trim() || title.trim(),
      seoDescription: seoDescription.trim() || excerpt.trim(),
    };

    try {
      const url = editingItem
        ? `/api/backend/journal/${editingItem.id}`
        : "/api/backend/journal";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Save operation failed");
      }

      toastSuccess(
        editingItem ? "Article Updated" : "Article Created",
        `"${title}" has been synchronized with the core backend.`
      );
      setIsFormOpen(false);
      fetchArticles();
    } catch (err: any) {
      toastError("Operation Failed", err.message || "Could not save article");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/backend/journal/${deleteConfirmItem.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete operation failed");

      toastSuccess("Article Deleted", `"${deleteConfirmItem.title}" was removed.`);
      setDeleteConfirmItem(null);
      fetchArticles();
    } catch (err: any) {
      toastError("Delete Failed", err.message || "Could not delete article");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Journal &amp; Market Insights
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              Go Core API
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Publish thought-leadership articles, African real estate trend reports, and press releases.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchArticles()}
            leftIcon={<RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
          >
            Sync
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={openCreateModal}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            New Article
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] p-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search articles by title, author, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 hidden sm:inline">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161c] px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            <option value="Market Insights">Market Insights</option>
            <option value="Architecture & Design">Architecture &amp; Design</option>
            <option value="Investment Intelligence">Investment Intelligence</option>
            <option value="Company News">Company News</option>
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-12 text-center bg-white/50 dark:bg-white/[0.01]">
          <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
            No journal articles found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {articles.length === 0
              ? "Your journal is currently empty. Click 'New Article' to publish market analyses and real estate insights."
              : "No articles match your current search criteria."}
          </p>
          {articles.length === 0 && (
            <Button size="sm" variant="primary" className="mt-4" onClick={openCreateModal}>
              Write First Article
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((art) => (
            <div
              key={art.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] overflow-hidden shadow-sm hover:border-[#ED2618]/30 transition-all"
            >
              <div className="relative h-40 w-full bg-slate-100 dark:bg-black/30 overflow-hidden">
                {art.coverImageUrl ? (
                  <img
                    src={art.coverImageUrl}
                    alt={art.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
                    <BookOpen className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute top-3 left-3">
                  <span className="rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                    {art.category}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs text-slate-300">By {art.author}</p>
                  <h3 className="text-sm font-bold text-white truncate">
                    {art.title}
                  </h3>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {art.excerpt || "No excerpt summary provided."}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-white/[0.06] pt-3">
                  <span className="font-mono truncate max-w-[150px]">/{art.slug}</span>
                  <span>{formatDate(art.updatedAt)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/[0.06] px-4 py-2.5 bg-slate-50/50 dark:bg-white/[0.01]">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      art.published ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {art.published ? "Published" : "Draft"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => openEditModal(art)}
                    leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                  >
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 dark:hover:text-red-400"
                    onClick={() => setDeleteConfirmItem(art)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Article Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? "Edit Journal Article" : "Write Journal Article"}
        description="Publish research, real estate market insights, and thought leadership pieces."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveArticle} className="space-y-4">
          <Input
            label="Article Title"
            placeholder="e.g. Navigating Pan-African Commercial Real Estate in 2026"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="URL Slug"
              placeholder="e.g. navigating-pan-african-commercial-real-estate"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Editorial Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="Market Insights">Market Insights</option>
                <option value="Architecture & Design">Architecture &amp; Design</option>
                <option value="Investment Intelligence">Investment Intelligence</option>
                <option value="Company News">Company News</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Author Name / Byline"
              placeholder="e.g. Dexta Research & Intelligence"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
            />
            <Input
              label="Cover Image CDN URL"
              placeholder="https://..."
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Article Excerpt &amp; Lead Summary
            </label>
            <textarea
              rows={3}
              placeholder="Compelling opening synopsis summarizing the key findings..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="SEO Title"
              placeholder="Article SEO Title | Dexta Africa"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
            <Input
              label="SEO Description"
              placeholder="Search engine preview text..."
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-3.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4 rounded text-red-600 focus:ring-red-500"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Publish on Live Website
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
            >
              {editingItem ? "Update Article" : "Publish to Core Backend"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmItem)}
        onClose={() => setDeleteConfirmItem(null)}
        title="Delete Article?"
        description="Permanently remove this article from the journal and public site."
        maxWidth="sm"
        footer={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeleteConfirmItem(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              isLoading={isSubmitting}
              onClick={handleDelete}
            >
              Confirm Delete
            </Button>
          </>
        }
      >
        {deleteConfirmItem && (
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 border border-red-200 dark:border-red-500/20 text-xs text-slate-700 dark:text-slate-300">
            Article: <strong className="text-slate-900 dark:text-white">{deleteConfirmItem.title}</strong>
          </div>
        )}
      </Modal>
    </div>
  );
}

