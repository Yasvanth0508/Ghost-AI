"use client";

import * as React from "react";
import {
  Check,
  Copy,
  Loader2,
  Lock,
  Mail,
  Trash2,
  User,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useShareDialog } from "@/hooks/use-share-dialog";
import { cn } from "@/lib/utils";

export interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  projectName?: string;
}

export function ShareDialog({
  isOpen,
  onOpenChange,
  projectId,
  projectName,
}: ShareDialogProps) {
  const {
    isOwner,
    owner,
    collaborators,
    emailInput,
    setEmailInput,
    isLoading,
    isInviting,
    removingId,
    error,
    isCopied,
    copyProjectLink,
    handleInvite,
    handleRemove,
  } = useShareDialog({
    projectId,
    isOpen,
    onOpenChange,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-subtle border border-border text-brand">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Share {projectName ? `"${projectName}"` : "Project"}</DialogTitle>
              <DialogDescription className="text-xs">
                Invite collaborators to work together in this real-time workspace.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Copy Link Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-primary">
              Project Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex h-9 flex-1 items-center rounded-xl border border-border bg-subtle px-3 text-xs font-mono text-text-secondary truncate select-all">
                {typeof window !== "undefined" ? window.location.href : ""}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyProjectLink}
                className={cn(
                  "h-9 gap-1.5 rounded-xl border-border px-3 text-xs font-medium transition-colors shrink-0",
                  isCopied
                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60"
                    : "bg-surface hover:bg-subtle text-primary"
                )}
              >
                {isCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Invite Section (Owners Only) */}
          {isOwner ? (
            <form onSubmit={handleInvite} className="space-y-1.5">
              <label
                htmlFor="collaborator-email"
                className="text-xs font-medium text-primary"
              >
                Invite by Email
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="collaborator-email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    disabled={isInviting}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isInviting || !emailInput.trim()}
                  className="h-9 rounded-xl bg-brand text-black font-semibold hover:bg-brand/90 px-4 text-xs shrink-0"
                >
                  {isInviting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      <span>Inviting...</span>
                    </>
                  ) : (
                    <span>Invite</span>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-subtle/50 p-2.5 text-xs text-text-secondary">
              <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>Only the project owner can invite or remove collaborators.</span>
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive font-medium">{error}</p>
          )}

          {/* Collaborator List */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-primary">
              Members & Collaborators
            </label>

            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground text-xs gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-brand" />
                <span>Loading collaborators...</span>
              </div>
            ) : (
              <ScrollArea className="max-h-[200px] rounded-xl border border-border bg-subtle/30 p-2">
                <div className="space-y-1">
                  {/* Owner Row */}
                  {owner && (
                    <div className="flex items-center justify-between rounded-lg p-2 hover:bg-subtle/60 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                        {owner.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={owner.imageUrl}
                            alt={owner.name || "Owner"}
                            className="h-7 w-7 rounded-full object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-medium shrink-0">
                            {owner.name ? owner.name[0].toUpperCase() : <User className="h-3.5 w-3.5" />}
                          </div>
                        )}
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs font-medium text-primary truncate">
                            {owner.name || "Project Owner"}
                          </p>
                          {owner.email && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {owner.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand border border-brand/20 shrink-0">
                        Owner
                      </span>
                    </div>
                  )}

                  {/* Collaborators Rows */}
                  {collaborators.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-lg p-2 hover:bg-subtle/60 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                        {c.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.imageUrl}
                            alt={c.name || c.email}
                            className="h-7 w-7 rounded-full object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-ai/10 border border-accent-ai/20 text-accent-ai-text text-xs font-medium shrink-0">
                            {c.name ? c.name[0].toUpperCase() : c.email[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs font-medium text-primary truncate">
                            {c.name || c.email}
                          </p>
                          {c.name && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {c.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-text-secondary">
                          Collaborator
                        </span>

                        {isOwner && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(c.id)}
                            disabled={removingId === c.id}
                            aria-label={`Remove ${c.name || c.email}`}
                            className="h-7 w-7 opacity-70 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                          >
                            {removingId === c.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {collaborators.length === 0 && !isLoading && (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      No collaborators yet.
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs font-medium"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
