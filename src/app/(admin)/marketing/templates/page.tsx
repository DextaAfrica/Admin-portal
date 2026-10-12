"use client";

import * as React from "react";
import { FileCode2, Eye, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";

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
  const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null);

  const fetchTemplates = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/marketing/templates");
      const data = await res.json();
      if (res.ok) setTemplates(data.templates || []);
    } catch {
      toastError("Error", "Could not load templates");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Email Templates Library
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pre-designed responsive HTML templates for transactional alerts and newsletters
          </p>
        </div>

        <Button size="sm" variant="secondary" onClick={() => fetchTemplates()} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((tpl) => {
          let vars: string[] = [];
          try {
            vars = JSON.parse(tpl.variables || "[]");
          } catch {
            vars = [];
          }

          return (
            <div
              key={tpl.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] p-5 shadow-sm hover:border-red-500/30 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="h-4 w-4 text-red-600 dark:text-rose-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{tpl.name}</h3>
                  </div>
                  {tpl.isDefault && (
                    <Badge variant="crimson" className="text-[10px]">System Default</Badge>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Subject: <span className="font-medium text-slate-800 dark:text-slate-200">{tpl.subject}</span>
                </p>

                <div className="flex flex-wrap gap-1 pt-1">
                  {vars.map((v, i) => (
                    <span key={i} className="rounded bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-mono text-red-600 dark:text-rose-400">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/[0.06] pt-3 text-xs text-slate-400">
                <span className="font-mono text-[10px]">Updated {formatDate(tpl.createdAt)}</span>
                <Button size="xs" variant="secondary" onClick={() => setSelectedTemplate(tpl)} leftIcon={<Eye className="h-3 w-3" />}>
                  Inspect HTML
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={Boolean(selectedTemplate)}
        onClose={() => setSelectedTemplate(null)}
        title={selectedTemplate?.name || "Template Preview"}
        maxWidth="lg"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div
              className="rounded-xl border border-slate-200 dark:border-white/10 p-5 bg-white dark:bg-[#15161c]"
              dangerouslySetInnerHTML={{ __html: selectedTemplate.bodyHtml }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

