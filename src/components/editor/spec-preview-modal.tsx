"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  FileCode2,
  Copy,
  Check,
  Loader2,
  Calendar,
} from "lucide-react";

export interface SpecPreviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  specId?: string;
  specTitle?: string;
  specCreatedAt?: string;
  initialContent?: string;
}

export function SpecPreviewModal({
  isOpen,
  onOpenChange,
  projectId,
  specId,
  specTitle,
  specCreatedAt,
  initialContent,
}: SpecPreviewModalProps) {
  const [content, setContent] = React.useState<string>(initialContent || "");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    if (!isOpen || !projectId || !specId || initialContent) return;

    React.startTransition(() => {
      setIsLoading(true);
      setError(null);
    });

    fetch(`/api/projects/${projectId}/specs/${specId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load specification content");
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setContent(data.content || "");
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load specification"
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, projectId, specId, initialContent]);

  const handleCopy = React.useCallback(() => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [content]);

  const handleDownload = React.useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!projectId || !specId) return;

    setIsDownloading(true);
    try {
      if (content) {
        const blob = new Blob([content], {
          type: "text/markdown; charset=utf-8",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const cleanName = (specTitle || "technical-spec")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        a.download = `${cleanName}-${specId.slice(-6)}.md`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }

      const res = await fetch(
        `/api/projects/${projectId}/specs/${specId}/download`
      );
      if (!res.ok) throw new Error("Failed to download specification");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spec-${specId.slice(-6)}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("[DOWNLOAD_ERROR]", err);
      window.open(
        `/api/projects/${projectId}/specs/${specId}/download`,
        "_blank"
      );
    } finally {
      setIsDownloading(false);
    }
  }, [projectId, specId, content, specTitle]);

  const formattedDate = specCreatedAt
    ? new Date(specCreatedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Draft Specification";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[92vw] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-base border-border">
        {/* Modal Header */}
        <DialogHeader className="p-4 sm:p-5 pb-3 sm:pb-4 border-b border-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-accent-ai/15 text-accent-ai-text border border-accent-ai/20">
              <FileCode2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm sm:text-base font-semibold text-primary truncate max-w-[220px] sm:max-w-md">
                {specTitle || "Technical Architecture Specification"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="truncate">{formattedDate}</span>
              </DialogDescription>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 mr-6 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={isLoading || !content}
              className="h-7 sm:h-8 gap-1.5 rounded-lg border-border text-xs text-primary hover:bg-subtle"
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-accent-ai-text" />
                  <span className="text-xs">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs hidden sm:inline">Copy Markdown</span>
                  <span className="text-xs sm:hidden">Copy</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isLoading || isDownloading}
              onClick={handleDownload}
              className="h-7 sm:h-8 gap-1.5 rounded-lg bg-brand text-black hover:bg-brand/90 font-medium text-xs transition-colors"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span className="text-xs hidden sm:inline">Download .md</span>
              <span className="text-xs sm:hidden">Download</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Modal Body: Markdown Document View */}
        <div className="flex-1 overflow-hidden p-6 bg-surface/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-accent-ai-text" />
              <p className="text-xs font-medium">Loading specification content...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2 text-red-400">
              <p className="text-xs font-semibold">{error}</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="prose prose-invert max-w-none text-xs leading-relaxed font-mono whitespace-pre-wrap selection:bg-accent-ai/30 text-text-primary">
                {content}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
