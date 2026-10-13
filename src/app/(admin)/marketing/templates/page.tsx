"use client";

import * as React from "react";
import {
  Eye,
  Plus,
  RefreshCw,
  User,
  CheckCircle2,
  LayoutTemplate,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import {
  EmailComposerStudio,
  EMAIL_OCCASION_PRESETS,
  compileStudioEmailHtml,
  type EmailOccasionId,
} from "@/components/marketing/EmailComposerStudio";

interface Template {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  variables: string;
  isDefault: boolean;
  createdAt: string;
}

export default function TemplatesPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedTemplate, setSelectedTemplate] = React.useState<{
    id?: string;
    name: string;
    subject: string;
    bodyHtml: string;
    presetId?: EmailOccasionId;
    createdAt?: string;
  } | null>(null);
  const [isStudioOpen, setIsStudioOpen] = React.useState(false);
  const [studioPreset, setStudioPreset] = React.useState<EmailOccasionId>("birthday");
  const [editingTemplateData, setEditingTemplateData] = React.useState<{
    id?: string;
    title: string;
    subject: string;
    contentHtml: string;
  } | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const fetchTemplates = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/marketing/templates");
      const data = await res.json();
      if (res.ok) setTemplates(data.templates || []);
    } catch {
      toastError("Unable to Load", "Could not load email templates.");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSaveTemplate = async (payload: {
    id?: string;
    title: string;
    subject: string;
    contentHtml: string;
    occasion: EmailOccasionId;
  }) => {
    setIsSaving(true);
    try {
      const isUpdating = Boolean(payload.id);
      const res = await fetch("/api/marketing/templates", {
        method: isUpdating ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payload.id,
          name: payload.title,
          subject: payload.subject,
          bodyHtml: payload.contentHtml,
          variables: ["firstName"],
        }),
      });
      if (res.ok) {
        toastSuccess(
          isUpdating ? "Template Updated" : "Template Saved",
          isUpdating
            ? "Your changes to this template have been saved."
            : "Your custom email template is now saved in your library."
        );
        setEditingTemplateData(null);
        setIsStudioOpen(false);
        fetchTemplates();
      } else {
        toastError("Save Error", "Could not save this template.");
      }
    } catch {
      toastError("Connection Error", "Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const res = await fetch("/api/marketing/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: templateId }),
      });
      if (res.ok) {
        toastSuccess("Template Deleted", "The template has been removed from your library.");
        fetchTemplates();
      } else {
        toastError("Delete Error", "Could not delete this template.");
      }
    } catch {
      toastError("Connection Error", "Please check your connection and try again.");
    }
  };

  const openBuilderWithPreset = (presetId: EmailOccasionId) => {
    setSelectedTemplate(null);
    setEditingTemplateData(null);
    setStudioPreset(presetId);
    setIsStudioOpen(true);
  };

  const openBuilderWithSavedTemplate = (tpl: {
    id?: string;
    name: string;
    subject: string;
    bodyHtml: string;
  }) => {
    setSelectedTemplate(null);
    setEditingTemplateData({
      id: tpl.id,
      title: tpl.name,
      subject: tpl.subject,
      contentHtml: tpl.bodyHtml,
    });
    setIsStudioOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-1">
            <LayoutTemplate className="h-3.5 w-3.5" />
            <span>Customizable Design System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Email Templates & Design Studio
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Customize any starter design or edit your saved templates visually and via live HTML.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchTemplates()}
            leftIcon={<RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setEditingTemplateData(null);
              setStudioPreset("birthday");
              setIsStudioOpen(!isStudioOpen);
            }}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            {isStudioOpen ? "Back to Template Gallery" : "Design New Template"}
          </Button>
        </div>
      </div>

      {isStudioOpen ? (
        <div className="space-y-4">
          <EmailComposerStudio
            key={
              editingTemplateData
                ? `edit_tpl_${editingTemplateData.id || editingTemplateData.title}`
                : `preset_tpl_${studioPreset}`
            }
            mode="template"
            initialPreset={studioPreset}
            initialData={editingTemplateData}
            isSubmitting={isSaving}
            onSaveDraft={handleSaveTemplate}
            onCancel={() => {
              setEditingTemplateData(null);
              setIsStudioOpen(false);
            }}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Saved Custom Templates in Database (Editable & Deletable!) */}
          {templates.length > 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Your Editable Workspace Templates ({templates.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Click &ldquo;Edit Design&rdquo; on any template below to customize its layout, images, colors, or HTML
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs hover:border-red-500/30 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {tpl.name}
                          </h3>
                        </div>
                        {tpl.isDefault && (
                          <Badge variant="crimson" className="text-[10px]">
                            Editable Template
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Subject Line:{" "}
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {tpl.subject}
                        </span>
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-white/[0.06] pt-3 text-xs text-slate-400">
                      <span>Updated {formatDate(tpl.createdAt)}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() =>
                            setSelectedTemplate({
                              id: tpl.id,
                              name: tpl.name,
                              subject: tpl.subject,
                              bodyHtml: tpl.bodyHtml,
                              createdAt: tpl.createdAt,
                            })
                          }
                          leftIcon={<Eye className="h-3.5 w-3.5" />}
                        >
                          Preview
                        </Button>
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => openBuilderWithSavedTemplate(tpl)}
                          leftIcon={<Pencil className="h-3 w-3" />}
                        >
                          Edit Design
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Template"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Featured Dexta Africa Occasion Gallery */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Starter Occasion Designs (Click Any to Customize & Save)
              </h2>
              <p className="text-xs text-slate-500">
                Fully customizable layouts for birthdays, invitations, newsletters, project updates, and blank custom designs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {EMAIL_OCCASION_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const compiledPreview = compileStudioEmailHtml(
                  { occasion: preset.id, ...preset.defaults },
                  true,
                  true
                );

                return (
                  <div
                    key={preset.id}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121318] overflow-hidden shadow-xs hover:shadow-md hover:border-red-500/30 transition-all"
                  >
                    <div>
                      {/* Mini Banner Thumbnail */}
                      <div className="relative h-40 w-full bg-slate-900 overflow-hidden">
                        {preset.defaults.heroImageUrl ? (
                          <img
                            src={preset.defaults.heroImageUrl}
                            alt={preset.label}
                            className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-red-950 text-white/70 text-xs font-bold">
                            Custom Blank Canvas
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-900 shadow-xs">
                            <Icon className="h-3 w-3 text-red-600" />
                            {preset.defaults.categoryBadge}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                          <span className="text-xs font-bold text-white drop-shadow-xs">
                            {preset.label}
                          </span>
                          <img
                            src="/dexta.svg"
                            alt="Dexta Africa"
                            className="h-4 w-auto bg-white/95 rounded px-1.5 py-0.5"
                          />
                        </div>
                      </div>

                      <div className="p-5 space-y-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {preset.defaults.headline}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {preset.tagline}
                        </p>
                        <p className="text-[11px] text-slate-400 pt-1">
                          Subject:{" "}
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {preset.defaults.subject}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() =>
                          setSelectedTemplate({
                            name: preset.label,
                            subject: preset.defaults.subject,
                            bodyHtml: compiledPreview,
                            presetId: preset.id,
                          })
                        }
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                      >
                        Preview
                      </Button>
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => openBuilderWithPreset(preset.id)}
                        leftIcon={<Pencil className="h-3 w-3" />}
                      >
                        Customize Design
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Full Email Preview Modal with One-Click "Edit Design in Studio" */}
      <Modal
        isOpen={Boolean(selectedTemplate)}
        onClose={() => setSelectedTemplate(null)}
        title={selectedTemplate?.name || "Template Preview"}
        description="Previewing template — click 'Customize This Design' below to edit every element or HTML"
        maxWidth="xl"
        footer={
          selectedTemplate ? (
            <div className="flex items-center justify-between w-full">
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  if (selectedTemplate.presetId) {
                    openBuilderWithPreset(selectedTemplate.presetId);
                  } else {
                    openBuilderWithSavedTemplate(selectedTemplate);
                  }
                }}
                leftIcon={<Pencil className="h-3.5 w-3.5" />}
              >
                Customize & Edit This Design
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedTemplate(null)}>
                Close Preview
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-4 border border-slate-200/80 dark:border-white/10 space-y-1.5">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {selectedTemplate.subject}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white">
                  <User className="h-3 w-3" />
                </span>
                <span>
                  From <strong className="text-slate-800 dark:text-slate-200">Dexta Africa</strong>
                </span>
              </div>
            </div>

            <div
              className="rounded-2xl bg-slate-100/70 dark:bg-[#0d0e12] p-4 sm:p-6 border border-slate-200/80 dark:border-white/10 max-h-[60vh] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: selectedTemplate.bodyHtml }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
