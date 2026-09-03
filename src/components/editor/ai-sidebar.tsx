"use client";

import * as React from "react";
import {
  Bot,
  Download,
  FileCode2,
  FileText,
  Loader2,
  Send,
  Sparkles,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOthers, useEventListener, useBroadcastEvent, useSelf, useRoom } from "@liveblocks/react";
import { useUser } from "@clerk/nextjs";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import type { designAgentTask } from "@/trigger/design-agent";
import { SpecPreviewModal } from "@/components/editor/spec-preview-modal";
import {
  validateStatusFeedMessage,
  validateChatFeedMessage,
  type StatusFeedMessage,
  type ChatFeedMessage,
} from "@/types/tasks";
import { cn } from "@/lib/utils";

export interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
}

const STARTER_PROMPT_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

export function AiSidebar({ isOpen, onClose, roomId }: AiSidebarProps) {
  const [activeTab, setActiveTab] = React.useState<"architect" | "specs">(
    "architect"
  );
  const [messages, setMessages] = React.useState<ChatFeedMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [activeRunId, setActiveRunId] = React.useState<string | undefined>();
  const [publicAccessToken, setPublicAccessToken] = React.useState<
    string | undefined
  >();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [latestStatus, setLatestStatus] =
    React.useState<StatusFeedMessage | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const room = useRoom();
  const targetRoomId = roomId || room?.id;
  const lastSubmittedPromptRef = React.useRef<string>("");

  // Spec Generation & List State
  const [specs, setSpecs] = React.useState<
    Array<{
      id: string;
      projectId: string;
      title?: string;
      filePath: string;
      createdAt: string;
    }>
  >([]);
  const [isLoadingSpecs, setIsLoadingSpecs] = React.useState(false);
  const [isGeneratingSpec, setIsGeneratingSpec] = React.useState(false);
  const [specError, setSpecError] = React.useState<string | null>(null);
  const [selectedSpec, setSelectedSpec] = React.useState<{
    id: string;
    title?: string;
    createdAt: string;
    content?: string;
  } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  // Fetch persisted project chat history
  React.useEffect(() => {
    let isMounted = true;
    if (!targetRoomId) return;

    fetch(`/api/projects/${targetRoomId}/messages`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && Array.isArray(data.messages)) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newItems = data.messages.filter(
              (m: ChatFeedMessage) => !existingIds.has(m.id)
            );
            if (newItems.length === 0 && prev.length > 0) return prev;
            return [...prev, ...newItems].sort(
              (a, b) => a.timestamp - b.timestamp
            );
          });
        }
      })
      .catch((err) => console.warn("[FETCH_MESSAGES_WARN]", err));

    return () => {
      isMounted = false;
    };
  }, [targetRoomId]);

  const fetchProjectSpecs = React.useCallback(async () => {
    if (!targetRoomId) return;
    setIsLoadingSpecs(true);
    try {
      const res = await fetch(`/api/projects/${targetRoomId}/specs`);
      if (!res.ok) throw new Error("Failed to load specifications");
      const data = await res.json();
      setSpecs(Array.isArray(data.specs) ? data.specs : []);
    } catch (err) {
      console.error("[FETCH_SPECS_ERROR]", err);
    } finally {
      setIsLoadingSpecs(false);
    }
  }, [targetRoomId]);

  React.useEffect(() => {
    let isMounted = true;
    if (!targetRoomId || activeTab !== "specs") return;

    React.startTransition(() => {
      setIsLoadingSpecs(true);
    });
    fetch(`/api/projects/${targetRoomId}/specs`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && Array.isArray(data.specs)) {
          setSpecs(data.specs);
        }
      })
      .catch((err) => console.error("[FETCH_SPECS_ERROR]", err))
      .finally(() => {
        if (isMounted) setIsLoadingSpecs(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetRoomId, activeTab]);

  const handleGenerateSpec = React.useCallback(async () => {
    if (!targetRoomId || isGeneratingSpec) return;
    setIsGeneratingSpec(true);
    setSpecError(null);

    try {
      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: targetRoomId,
          chatHistory: messages,
          mode: "direct",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate specification");
      }

      await fetchProjectSpecs();

      if (data.specId && data.markdown) {
        setSelectedSpec({
          id: data.specId,
          title: data.title,
          createdAt: new Date().toISOString(),
          content: data.markdown,
        });
        setIsPreviewOpen(true);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate specification";
      setSpecError(msg);
    } finally {
      setIsGeneratingSpec(false);
    }
  }, [targetRoomId, isGeneratingSpec, messages, fetchProjectSpecs]);

  const handleDownloadSpec = React.useCallback(
    async (specId: string, specTitle?: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!targetRoomId || !specId) return;

      try {
        const res = await fetch(
          `/api/projects/${targetRoomId}/specs/${specId}/download`
        );
        if (!res.ok) throw new Error("Failed to download specification");
        const blob = await res.blob();
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
      } catch (err) {
        console.error("[DOWNLOAD_ERROR]", err);
        window.open(
          `/api/projects/${targetRoomId}/specs/${specId}/download`,
          "_blank"
        );
      }
    },
    [targetRoomId]
  );

  const { user } = useUser();
  const self = useSelf();
  const broadcast = useBroadcastEvent();

  const currentUserName =
    user?.fullName ||
    user?.firstName ||
    (self?.info as { name?: string } | undefined)?.name ||
    "User";

  // Subscribe to real-time Trigger.dev run updates via publicToken
  const { run } = useRealtimeRun<typeof designAgentTask>(
    activeRunId,
    {
      accessToken: publicAccessToken,
      enabled: !!activeRunId,
      onComplete: (completedRun, err) => {
        if (completedRun?.status === "COMPLETED") {
          const summary =
            (completedRun.output as { summary?: string } | undefined)
              ?.summary ||
            "I've generated the system architecture directly on your canvas!";

          const assistantMsg: ChatFeedMessage = {
            id: `reply-${completedRun.id || Date.now()}`,
            sender: "Ghost AI",
            role: "assistant",
            content: summary,
            timestamp: Date.now(),
          };

          const valMsg = validateChatFeedMessage(assistantMsg);
          if (valMsg) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === valMsg.id)) return prev;
              return [...prev, valMsg];
            });
            try {
              broadcast({ type: "ai-chat", data: valMsg });
            } catch {
              // ignore
            }
          }
        } else if (
          err ||
          (completedRun?.status &&
            [
              "FAILED",
              "CRASHED",
              "SYSTEM_FAILURE",
              "CANCELED",
              "INTERRUPTED",
            ].includes(completedRun.status))
        ) {
          const errMsg =
            (completedRun?.error as { message?: string } | undefined)?.message ||
            err?.message ||
            "AI architecture generation failed.";

          const assistantMsg: ChatFeedMessage = {
            id: `err-${completedRun?.id || Date.now()}`,
            sender: "Ghost AI",
            role: "assistant",
            content: `Generation failed: ${errMsg}`,
            timestamp: Date.now(),
          };

          const valMsg = validateChatFeedMessage(assistantMsg);
          if (valMsg) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === valMsg.id)) return prev;
              return [...prev, valMsg];
            });
            try {
              broadcast({ type: "ai-chat", data: valMsg });
            } catch {
              // ignore
            }
          }
        }

        setActiveRunId(undefined);
        setPublicAccessToken(undefined);
      },
    }
  );

  // Watchdog: If a Trigger.dev task is queued without an active worker in dev for >15s, seamlessly execute directly
  React.useEffect(() => {
    if (!activeRunId || !targetRoomId) return;

    const timer = setTimeout(async () => {
      if (!run || ["WAITING_FOR_DEPLOY", "QUEUED"].includes(run.status)) {
        const promptToRun = lastSubmittedPromptRef.current;
        setActiveRunId(undefined);
        setPublicAccessToken(undefined);

        if (promptToRun) {
          setIsSubmitting(true);
          try {
            const res = await fetch("/api/ai/design", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: promptToRun,
                roomId: targetRoomId,
                mode: "direct",
                chatHistory: messages,
                sender: currentUserName,
              }),
            });
            const data = await res.json();
            if (data.success) {
              const assistantMsg: ChatFeedMessage = {
                id: `reply-${Date.now()}`,
                sender: "Ghost AI",
                role: "assistant",
                content:
                  data.summary ||
                  "I've generated the system architecture directly on your canvas!",
                timestamp: Date.now(),
              };
              const valMsg = validateChatFeedMessage(assistantMsg);
              if (valMsg) {
                setMessages((prev) => [...prev, valMsg]);
                try {
                  broadcast({ type: "ai-chat", data: valMsg });
                } catch {
                  // ignore
                }
              }
            }
          } catch (watchdogErr) {
            console.error("[WATCHDOG_DIRECT_ERR]", watchdogErr);
          } finally {
            setIsSubmitting(false);
          }
        }
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [activeRunId, run, targetRoomId, broadcast, messages, currentUserName]);

  // Subscribe to room presence: check if AI or any participant is thinking
  const isAnyoneThinking = useOthers((others) =>
    others.some((other) => other.presence?.thinking === true)
  );

  // Subscribe to shared ai-chat and ai-status room events
  useEventListener((eventData) => {
    const rawEvent = eventData?.event as unknown;
    if (rawEvent && typeof rawEvent === "object" && "type" in rawEvent) {
      const typedEvent = rawEvent as { type: unknown; data?: unknown };

      // 1. Handle room chat messages
      if (typedEvent.type === "ai-chat" && "data" in typedEvent) {
        const validated = validateChatFeedMessage(typedEvent.data);
        if (validated) {
          setMessages((prev) => {
            if (validated.id && prev.some((m) => m.id === validated.id)) {
              return prev;
            }
            return [...prev, validated];
          });
        }
      }

      // 2. Handle AI status updates
      if (typedEvent.type === "ai-status" && "data" in typedEvent) {
        const validated = validateStatusFeedMessage(typedEvent.data);
        if (validated) {
          setLatestStatus(validated);
        }
      }
    }
  });

  const isRunActive =
    isSubmitting ||
    (!!activeRunId &&
      (!run ||
        [
          "WAITING_FOR_DEPLOY",
          "QUEUED",
          "EXECUTING",
          "RETRYING_AFTER_FAILURE",
          "WAITING_ON_CONNECTIONS",
          "SUSPENDED",
        ].includes(run.status)));

  const isGenerating =
    isRunActive ||
    isAnyoneThinking ||
    (latestStatus?.status != null &&
      ["started", "thinking", "generating", "updating_canvas"].includes(
        latestStatus.status
      ));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isGenerating) return;
    setInput(e.target.value);
    setSendError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        Math.max(textareaRef.current.scrollHeight, 72),
        160
      )}px`;
    }
  };

  const handleSend = React.useCallback(
    async (textToSend?: string) => {
      if (isGenerating) return;
      const content = (textToSend ?? input).trim();
      if (!content) return;

      const newMsg: ChatFeedMessage = {
        id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sender: currentUserName,
        role: "user",
        content,
        timestamp: Date.now(),
      };

      const validated = validateChatFeedMessage(newMsg);
      if (!validated) {
        setSendError("Message validation failed");
        return;
      }

      setMessages((prev) => [...prev, validated]);
      setInput("");
      setSendError(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "72px";
      }

      try {
        broadcast({
          type: "ai-chat",
          data: validated,
        });
      } catch (err) {
        console.error("[AI_CHAT_BROADCAST_ERROR]", err);
      }

      // Trigger AI design task
      if (targetRoomId) {
        setIsSubmitting(true);
        lastSubmittedPromptRef.current = content;
        try {
          const res = await fetch("/api/ai/design", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: content,
              roomId: targetRoomId,
              chatHistory: messages,
              sender: currentUserName,
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Failed to start AI design task");
          }

          if (data.mode === "direct") {
            if (data.success) {
              const assistantMsg: ChatFeedMessage = {
                id: `reply-${Date.now()}`,
                sender: "Ghost AI",
                role: "assistant",
                content:
                  data.summary ||
                  "I've generated the system architecture directly on your canvas!",
                timestamp: Date.now(),
              };
              const valMsg = validateChatFeedMessage(assistantMsg);
              if (valMsg) {
                setMessages((prev) => [...prev, valMsg]);
                try {
                  broadcast({ type: "ai-chat", data: valMsg });
                } catch {
                  // ignore
                }
              }
            } else {
              throw new Error(
                data.error || "Direct architecture generation failed"
              );
            }
          } else if (data.runId) {
            setActiveRunId(data.runId);
            setPublicAccessToken(data.publicToken || undefined);
          }
        } catch (err) {
          const errMsg =
            err instanceof Error ? err.message : "Failed to trigger AI design";
          setSendError(errMsg);

          const errorMsg: ChatFeedMessage = {
            id: `err-${Date.now()}`,
            sender: "Ghost AI",
            role: "assistant",
            content: `Generation failed: ${errMsg}`,
            timestamp: Date.now(),
          };
          const valErr = validateChatFeedMessage(errorMsg);
          if (valErr) {
            setMessages((prev) => [...prev, valErr]);
            try {
              broadcast({ type: "ai-chat", data: valErr });
            } catch {
              // ignore
            }
          }
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [input, isGenerating, currentUserName, broadcast, targetRoomId, messages]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <aside
      aria-label="AI Workspace"
      className={cn(
        "flex flex-col h-full border-l border-border bg-[#111114] shadow-2xl transition-all duration-300 ease-in-out shrink-0 overflow-hidden select-none",
        isOpen
          ? "w-80 sm:w-96 opacity-100"
          : "w-0 opacity-0 border-l-0 pointer-events-none"
      )}
    >
      {/* Sidebar Header - h-14 to match Navbar and Project Sidebar */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4 shrink-0 bg-[#111114]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00A300]/15 border border-[#00A300]/30 text-[#00A300]">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold tracking-tight text-white">
                AI Workspace
              </h3>
              {isGenerating && (
                <span className="flex h-2 w-2 rounded-full bg-[#00A300] animate-pulse" />
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              {isGenerating ? "AI is collaborating..." : "Collaborate with Ghost AI"}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close AI Sidebar"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-white hover:bg-accent transition-colors"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs Layout */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "architect" | "specs")}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="px-4 pt-3 shrink-0">
          <TabsList className="grid w-full grid-cols-2 rounded-xl border border-border bg-[#18181c] p-1">
            <TabsTrigger
              value="architect"
              className="rounded-lg text-xs font-medium text-zinc-400 transition-all data-[state=active]:bg-[#24242a] data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <Bot className="h-3.5 w-3.5 mr-1.5 text-[#00A300]" />
              <span>AI Architect</span>
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="rounded-lg text-xs font-medium text-zinc-400 transition-all data-[state=active]:bg-[#24242a] data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <FileCode2 className="h-3.5 w-3.5 mr-1.5 text-[#00A300]" />
              <span>Specs</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 1. AI Architect Tab Content */}
        <TabsContent
          value="architect"
          className="flex flex-1 flex-col justify-between overflow-hidden mt-0 p-4 pt-3 gap-3"
        >
          {/* Scrollable Chat Area with spacious top padding */}
          <ScrollArea className="flex-1 pr-3 -mr-3">
            {messages.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center text-center py-6 px-2 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00A300]/10 border border-[#00A300]/25 text-[#00A300] shadow-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">
                    Ghost AI Architect
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-[240px] leading-relaxed">
                    Ask AI to generate diagrams, refine architecture, or suggest
                    cloud topology.
                  </p>
                </div>

                {/* Starter Prompt Chips */}
                <div className="w-full space-y-2 pt-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Suggested Prompts
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {STARTER_PROMPT_CHIPS.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => handleSend(chip)}
                        className={cn(
                          "group flex items-center justify-between rounded-xl border border-border bg-subtle/70 px-3 py-2 text-left text-xs transition-all",
                          isGenerating
                            ? "opacity-50 cursor-not-allowed text-muted-foreground"
                            : "text-zinc-300 hover:border-[#00A300]/50 hover:bg-[#00A300]/10 hover:text-white cursor-pointer"
                        )}
                      >
                        <span className="truncate">{chip}</span>
                        <Sparkles className="h-3 w-3 opacity-40 group-hover:opacity-100 group-hover:text-[#00A300] transition-opacity shrink-0 ml-1.5" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Messages List with ample top spacing below header/tabs */
              <div className="space-y-4 pt-4 pb-2">
                {messages.map((msg) => {
                  const isSelf =
                    msg.role === "user" && msg.sender === currentUserName;
                  const isAssistant = msg.role === "assistant";
                  const formattedTime = new Date(
                    msg.timestamp
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={msg.id || `${msg.sender}-${msg.timestamp}`}
                      className={cn(
                        "flex flex-col",
                        isSelf ? "items-end" : "items-start"
                      )}
                    >
                      {/* Sender label for non-self messages */}
                      {!isSelf && (
                        <span className="mb-1 text-[10px] font-medium text-zinc-400 px-1 flex items-center gap-1">
                          {isAssistant && (
                            <Bot className="h-3 w-3 text-[#00A300]" />
                          )}
                          <span>{isAssistant ? "Ghost AI" : msg.sender}</span>
                        </span>
                      )}

                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 text-xs leading-relaxed max-w-[88%] shadow-md",
                          isSelf
                            ? "bg-black border-2 border-[#00A300] text-white rounded-tr-sm"
                            : isAssistant
                            ? "bg-[#18181c] border border-border text-zinc-100 rounded-tl-sm"
                            : "bg-[#18181c] border border-border text-white rounded-tl-sm"
                        )}
                      >
                        <p className="whitespace-pre-wrap text-white font-normal">{msg.content}</p>
                      </div>

                      <span className="mt-1 text-[9px] text-zinc-500 px-1">
                        {formattedTime}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Shared AI Activity Status Banner */}
          {(isGenerating || (latestStatus && latestStatus.status)) && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-xs transition-all animate-in fade-in duration-200 shrink-0",
                latestStatus?.status === "error"
                  ? "border border-red-500/30 bg-red-950/20 text-red-400"
                  : "border border-[#00A300]/30 bg-[#00A300]/10 text-[#00A300]"
              )}
            >
              {latestStatus?.status === "error" ? (
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
              ) : isGenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-[#00A300]" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#00A300]" />
              )}
              <div className="flex-1 truncate">
                <span className="font-medium text-[11px]">
                  {latestStatus?.text ||
                    (isGenerating
                      ? "Ghost AI is generating architecture..."
                      : "Generation completed")}
                </span>
              </div>
              {latestStatus?.step && (
                <span className="rounded px-1.5 py-0.5 text-[9px] font-mono uppercase bg-[#18181c] border border-border text-zinc-400">
                  {latestStatus.step}
                </span>
              )}
            </div>
          )}

          {/* Chat Input Area: Pure Black Background, #00A300 Border, Pure White Text */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <div
              className={cn(
                "relative rounded-2xl border-2 border-[#00A300] bg-black p-2.5 transition-all",
                isGenerating
                  ? "opacity-60 cursor-not-allowed"
                  : "focus-within:border-[#00A300] focus-within:ring-2 focus-within:ring-[#00A300]/30 shadow-md shadow-[#00A300]/5"
              )}
            >
              <Textarea
                ref={textareaRef}
                value={input}
                disabled={isGenerating}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={
                  isGenerating
                    ? "Ghost AI is currently generating architecture..."
                    : "Ask AI to design, update, or optimize architecture..."
                }
                className={cn(
                  "min-h-[72px] max-h-[160px] w-full resize-none border-0 bg-transparent p-1.5 text-xs text-white placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:outline-none shadow-none leading-relaxed",
                  isGenerating && "cursor-not-allowed"
                )}
              />
              <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800 px-1">
                <span className="text-[10px] text-zinc-500">
                  {isGenerating
                    ? "Generation in progress..."
                    : "↵ to send · Shift+↵ newline"}
                </span>
                <Button
                  type="button"
                  size="icon"
                  disabled={isGenerating || !input.trim()}
                  onClick={() => handleSend()}
                  className={cn(
                    "h-7 w-7 rounded-lg transition-all",
                    isGenerating
                      ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                      : input.trim()
                      ? "bg-[#00A300] text-black font-bold hover:bg-[#00A300]/90 shadow-sm cursor-pointer"
                      : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  )}
                >
                  {isGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {sendError && (
              <div className="flex items-center gap-1 text-[11px] text-red-400 px-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{sendError}</span>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 2. Specs Tab Content */}
        <TabsContent
          value="specs"
          className="flex flex-1 flex-col justify-between overflow-hidden mt-0 p-4 pt-3 gap-3"
        >
          <ScrollArea className="flex-1 pr-3 -mr-3">
            <div className="space-y-4 pb-2">
              {/* Generate Spec Action */}
              <Button
                type="button"
                disabled={isGeneratingSpec}
                onClick={handleGenerateSpec}
                className="w-full gap-2 rounded-xl bg-[#00A300] text-black font-bold hover:bg-[#00A300]/90 shadow-sm text-xs h-9 transition-all cursor-pointer"
              >
                {isGeneratingSpec ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>
                  {isGeneratingSpec
                    ? "Generating Architecture Spec..."
                    : "Generate Spec"}
                </span>
              </Button>

              {specError && (
                <div className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/20 px-3 py-2 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{specError}</span>
                </div>
              )}

              {/* Dynamic Specs List */}
              {isLoadingSpecs ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-2 text-zinc-400">
                  <Loader2 className="h-5 w-5 animate-spin text-[#00A300]" />
                  <span className="text-xs">Loading specifications...</span>
                </div>
              ) : specs.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-8 px-3 space-y-3 rounded-2xl border border-dashed border-border/80 bg-subtle/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00A300]/10 text-[#00A300] border border-[#00A300]/20">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-white">
                      No Specifications Yet
                    </h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Click &quot;Generate Spec&quot; to create a comprehensive
                      Markdown technical architecture document from your canvas.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      Architecture Documents ({specs.length})
                    </span>
                  </div>

                  {specs.map((spec) => {
                    const dateStr = new Date(spec.createdAt).toLocaleDateString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    );

                    return (
                      <div
                        key={spec.id}
                        onClick={() => {
                          setSelectedSpec({
                            id: spec.id,
                            title: spec.title,
                            createdAt: spec.createdAt,
                          });
                          setIsPreviewOpen(true);
                        }}
                        className="group relative flex flex-col gap-2 rounded-2xl border border-border bg-[#18181c] p-3.5 shadow-sm hover:border-[#00A300]/50 hover:bg-[#1e1e24] transition-all cursor-pointer select-none"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00A300]/15 text-[#00A300] border border-[#00A300]/20 shrink-0">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-semibold text-white truncate group-hover:text-[#00A300] transition-colors" title={spec.title || "Technical Spec"}>
                                {spec.title || "Technical Architecture Spec"}
                              </h5>
                              <p className="text-[10px] text-zinc-400 truncate">
                                {dateStr}
                              </p>
                            </div>
                          </div>

                          <span className="rounded-md border border-[#00A300]/30 bg-[#00A300]/10 px-1.5 py-0.5 text-[9px] font-mono text-[#00A300] shrink-0">
                            Markdown
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                          <span className="text-[10px] font-mono text-muted-foreground/70 truncate max-w-[130px]">
                            {spec.id}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSpec({
                                  id: spec.id,
                                  title: spec.title,
                                  createdAt: spec.createdAt,
                                });
                                setIsPreviewOpen(true);
                              }}
                              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-primary rounded-md cursor-pointer"
                            >
                              View
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) =>
                                handleDownloadSpec(spec.id, spec.title, e)
                              }
                              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-primary rounded-md border-border cursor-pointer"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              <span>.md</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Spec Preview Modal */}
      <SpecPreviewModal
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        projectId={targetRoomId}
        specId={selectedSpec?.id}
        specTitle={selectedSpec?.title}
        specCreatedAt={selectedSpec?.createdAt}
        initialContent={selectedSpec?.content}
      />
    </aside>
  );
}
