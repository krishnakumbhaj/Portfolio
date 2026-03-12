"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Loader2,
  Plus,
  ArrowLeft,
  ArrowUp,
  Square,
  Check,
  X,
  User,
  Mail,
  Phone,
  MessageSquare,
  Briefcase,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Copy,
  Pencil,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import Image from "next/image";
import Logo from '../Images/logo.png';
import Logo_name from '../Images/logo_name.png';
import GithubLogo from '../app/images/Github.png';
import GmailLogo from '../app/images/Gmail.webp';
import { cn } from "@/lib/utils";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";

// =============================================================================
// TYPES
// =============================================================================

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ConfirmationData {
  tool: string;
  tool_call_id: string;
  details: {
    name: string;
    email: string;
    reason: string;
    mobile_number?: string;
    about_user?: string;
    message?: string;
  };
}

interface ConnectionResult {
  action: 'sent' | 'cancelled';
  details: ConfirmationData['details'];
}

interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatHistoryResponse {
  success: boolean;
  messages: StoredMessage[];
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const FASTAPI_URL =
  process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";
const NEXTJS_API_URL = "/api/portfolio-chat";

const SUGGESTED_QUESTIONS = [
  "What are Krishna's main skills?",
  "Tell me about his projects",
  "What experience does he have?",
  "How can I connect with him?",
];

// =============================================================================
// STREAMING CURSOR (blinking caret at end of streaming text)
// =============================================================================

function StreamingCursor() {
  return (
    <span className="inline-block w-[3px] h-[1.1em] bg-white/70 ml-0.5 align-middle animate-pulse" />
  );
}

// =============================================================================
// PORTFOLIO CHAT UI COMPONENT
// =============================================================================

export default function PortfolioChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [reactions, setReactions] = useState<Record<string, "like" | "dislike">>({}); 

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load reactions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("portfolio_chat_reactions");
      if (stored) setReactions(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const toggleReaction = (msgId: string, type: "like" | "dislike") => {
    setReactions((prev) => {
      const updated = { ...prev };
      if (updated[msgId] === type) {
        delete updated[msgId]; // toggle off
      } else {
        updated[msgId] = type;
      }
      localStorage.setItem("portfolio_chat_reactions", JSON.stringify(updated));
      return updated;
    });
  };

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior,
        });
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ==========================================================================
  // FETCH CHAT HISTORY
  // ==========================================================================

  const fetchChatHistory = useCallback(async (sid: string) => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch(`${NEXTJS_API_URL}/session/${sid}`);
      if (!response.ok) return;

      const data: ChatHistoryResponse = await response.json();
      if (data.success && data.messages && data.messages.length > 0) {
        const loadedMessages: Message[] = data.messages.map((msg, index) => ({
          id: `loaded-${index}-${Date.now()}`,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(loadedMessages);
      }
    } catch (err) {
      console.error("Error fetching chat history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem("portfolio_chat_session_id");
    if (storedSessionId) {
      setSessionId(storedSessionId);
      fetchChatHistory(storedSessionId);
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      setSessionId(newSessionId);
      localStorage.setItem("portfolio_chat_session_id", newSessionId);
      setIsLoadingHistory(false);
    }
  }, [fetchChatHistory]);

  // ==========================================================================
  // STOP GENERATION
  // ==========================================================================

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setActiveTool(null);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.isStreaming ? { ...msg, isStreaming: false } : msg
      )
    );
  };

  // ==========================================================================
  // SEND MESSAGE (REAL SSE STREAMING)
  // ==========================================================================

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading || isConfirming) return;

    // If graph is interrupted (confirmation card showing), auto-cancel first
    // LangGraph won't accept new input while paused — must resume before sending
    if (confirmationData) {
      setConfirmationData(null);
      try {
        const cancelRes = await fetch(`${FASTAPI_URL}/portfolio/chat/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            action: "cancelled",
            reason: "User wants to modify details",
          }),
        });
        // Consume the cancel stream to completion so the graph finishes
        const cancelReader = cancelRes.body?.getReader();
        if (cancelReader) {
          while (true) {
            const { done } = await cancelReader.read();
            if (done) break;
          }
        }
      } catch (err) {
        console.error("Auto-cancel interrupt error:", err);
      }
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);
    setActiveTool(null);
    // Immediate scroll after adding user message
    scrollToBottom();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch(`${FASTAPI_URL}/portfolio/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: sessionId,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const headerSessionId = response.headers.get("X-Session-Id");
      if (headerSessionId && headerSessionId !== sessionId) {
        setSessionId(headerSessionId);
        localStorage.setItem("portfolio_chat_session_id", headerSessionId);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const payload = JSON.parse(line.slice(6));

            if (payload.type === "token") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, content: msg.content + payload.content }
                    : msg
                )
              );
            } else if (payload.type === "tool_start") {
              setActiveTool(payload.tool);
            } else if (payload.type === "tool_end") {
              setActiveTool(null);
            } else if (payload.type === "done") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );
            } else if (payload.type === "confirmation_required") {
              // LangGraph interrupt — show confirmation card
              setConfirmationData(payload.data);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );
              setIsLoading(false);
            } else if (payload.type === "error") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? {
                        ...msg,
                        content: payload.content,
                        isStreaming: false,
                      }
                    : msg
                )
              );
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  isStreaming: false,
                  content: msg.content || "Generation stopped.",
                }
              : msg
          )
        );
      } else {
        console.error("Chat error:", err);
        setError("Failed to connect to AI. Please try again.");
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content:
                    "Sorry, I couldn't connect right now. Please try again.",
                  isStreaming: false,
                }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      setActiveTool(null);
      abortControllerRef.current = null;
    }
  };

  // ==========================================================================
  // RESET CHAT
  // ==========================================================================

  const resetChat = async () => {
    stopGeneration();

    if (sessionId) {
      try {
        await fetch(`${FASTAPI_URL}/portfolio/session/${sessionId}`, {
          method: "DELETE",
        });
      } catch {
        /* ignore */
      }
      try {
        await fetch(`${NEXTJS_API_URL}/session/${sessionId}`, {
          method: "DELETE",
        });
      } catch {
        /* ignore */
      }
    }

    localStorage.removeItem("portfolio_chat_session_id");
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    setSessionId(newSessionId);
    localStorage.setItem("portfolio_chat_session_id", newSessionId);
    setMessages([]);
    setError(null);
  };

  // ==========================================================================
  // CONFIRM / CANCEL CONNECTION (Human-in-the-loop)
  // ==========================================================================

  const handleConnectionDecision = async (action: "confirmed" | "cancelled") => {
    if (!sessionId || !confirmationData) return;

    const savedDetails = { ...confirmationData.details };

    setIsConfirming(true);
    setConfirmationData(null);

    // Add a status message
    const statusId = `status-${Date.now()}`;
    const assistantMessage: Message = {
      id: statusId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${FASTAPI_URL}/portfolio/chat/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          action,
          reason: action === "cancelled" ? "User cancelled from confirmation card" : undefined,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.type === "token") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === statusId
                    ? { ...msg, content: msg.content + payload.content }
                    : msg
                )
              );
            } else if (payload.type === "tool_start") {
              setActiveTool(payload.tool);
            } else if (payload.type === "tool_end") {
              setActiveTool(null);
            } else if (payload.type === "done") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === statusId
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );
            } else if (payload.type === "error") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === statusId
                    ? { ...msg, content: payload.content, isStreaming: false }
                    : msg
                )
              );
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      console.error("Confirm error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === statusId
            ? { ...msg, content: "Something went wrong. Please try again.", isStreaming: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setIsConfirming(false);
      setActiveTool(null);
      setConnectionResult({
        action: action === 'confirmed' ? 'sent' : 'cancelled',
        details: savedDetails,
      });
    }
  };

  // ==========================================================================
  // COPY TO CLIPBOARD
  // ==========================================================================

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  // ==========================================================================
  // EDIT USER MESSAGE
  // ==========================================================================

  const startEdit = (message: Message) => {
    setEditingId(message.id);
    setEditText(message.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const submitEdit = async (messageId: string) => {
    if (!editText.trim() || isLoading) return;

    // Find the message index
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    // Remove this message and all messages after it
    setMessages((prev) => prev.slice(0, msgIndex));
    setEditingId(null);

    // Send the edited message as a new message
    await sendMessage(editText.trim());
    setEditText("");
  };

  // ==========================================================================
  // SUBMIT HANDLER
  // ==========================================================================

  const handleSubmit = () => {
    if (isLoading) {
      stopGeneration();
    } else {
      sendMessage();
    }
  };

  // ==========================================================================
  // TOOL LOGO HELPER
  // ==========================================================================

  const getToolLogo = (toolName: string | null) => {
    if (!toolName) return null;
    const name = toolName.toLowerCase();
    if (name.includes("github") || name.includes("repo") || name.includes("pinned")) return GithubLogo;
    if (name.includes("email") || name.includes("gmail") || name.includes("connection") || name.includes("send")) return GmailLogo;
    return null;
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="h-dvh bg-[#171717] flex flex-col overflow-hidden relative">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#171616] backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex justify-start items-center gap-0">
              <div className="flex justify-center items-center overflow-hidden flex-shrink-0">
                {/* <Image
                  src={Logo}
                  alt="Logo"
                  className="w-14 h-14 ml-3 sm:w-16 sm:h-16 object-cover"
                /> */}
              </div>
              <Image
                src={Logo_name}
                alt="Logo Name"
                className="w-14 h-14 sm:w-20 sm:h-20 object-contain -ml-3"
              />
              
            </div>
              
          </div>

          <button
            onClick={resetChat}
            className="flex items-center gap-2 px-2 py-2 bg-[#6e5dff] rounded-full text-white hover:text-white hover:bg-[#6e5dff]/80  transition-colors"
          >
            <Plus className="w-7 h-7" />
            {/* <span className="text-sm hidden sm:inline">New Chat</span> */}
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 pb-36">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Loading History */}
          {isLoadingHistory && (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin" />
              <p className="text-white/50">Loading chat history...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingHistory && messages.length === 0 && (
            <div className="text-center py-12 sm:py-20">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl  flex items-center justify-center">
                <Image src={Logo} alt="Logo" className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Hey there!
              </h2>
              <p className="text-white/50 mb-8 max-w-lg mx-auto text-base sm:text-lg px-4">
                I&apos;m Krishna&apos;s AI assistant. Ask me about his skills,
                projects, experience, or how to get in touch!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto px-4">
                {SUGGESTED_QUESTIONS.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(question)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-[15px] text-left transition-all",
                      "bg-white/[0.03] text-white/70 border border-white/10",
                      "hover:bg-white/[0.08] hover:border-white/20 hover:text-white",
                      "active:scale-[0.98]"
                    )}
                  >
                    <span className="text-blue-400 mr-2">&rarr;</span>
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-8 sm:space-y-10">
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === "user" ? (
                  <div className="flex justify-end group/user">
                    <div className="max-w-[80%] sm:max-w-[75%]">
                      {editingId === message.id ? (
                        <div className="bg-[#1a1a1a] border border-[#6e5dff]/30 rounded-2xl overflow-hidden shadow-lg shadow-black/30">
                          {/* Green accent bar */}
                          <div className="h-0.5 bg-gradient-to-r from-[#6e5dff] via-[#6e5dff]/50 to-transparent" />
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Pencil className="w-3.5 h-3.5 text-[#6e5dff]/60" />
                              <span className="text-xs text-[#6e5dff]/60 font-medium uppercase tracking-wider">Editing message</span>
                            </div>
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/10 text-white text-[15px] sm:text-base leading-relaxed resize-none outline-none min-h-[80px] rounded-xl p-3 focus:border-[#6e5dff]/30 transition-colors placeholder:text-white/20"
                              autoFocus
                              placeholder="Edit your message..."
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  submitEdit(message.id);
                                }
                                if (e.key === "Escape") cancelEdit();
                              }}
                            />
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-[10px] text-white/20">
                                Enter to send &middot; Esc to cancel
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={cancelEdit}
                                  className="flex items-center gap-1.5 px-4 py-2 text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                                >
                                  <X className="w-3 h-3" />
                                  Cancel
                                </button>
                                <button
                                  onClick={() => submitEdit(message.id)}
                                  disabled={!editText.trim()}
                                  className="flex items-center gap-1.5 px-4 py-2 text-xs text-[#1a1a1a] bg-[#6e5dff] hover:bg-[#b8d9a8] rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                  Send
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="bg-black/20 text-white rounded-2xl rounded-br-sm px-5 py-3">
                            <p className="text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                          </div>
                          {/* Copy + Edit buttons */}
                          <div className="flex items-center justify-end gap-1.5 mt-1.5 pr-1 opacity-0 group-hover/user:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(message)}
                              className="p-1 text-white/25 hover:text-white/60 transition-colors rounded"
                              title="Edit message"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => copyToClipboard(message.content, message.id)}
                              className="p-1 text-white/25 hover:text-white/60 transition-colors rounded"
                              title="Copy"
                            >
                              {copiedId === message.id ? (
                                <Check className="w-3 h-3 text-[#6e5dff] animate-in zoom-in duration-200" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <span className="text-[10px] text-white/25">
                              {message.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="min-w-0">
                      {message.content ? (
                        <div
                          className="prose prose-invert max-w-none
                            text-[15px] sm:text-base leading-[1.85] text-white/90

                            prose-p:my-3 prose-p:leading-[1.85]
                            [&>p:first-child]:mt-0

                            prose-headings:text-white prose-headings:font-bold
                            prose-h1:text-2xl sm:prose-h1:text-[28px] prose-h1:mt-6 prose-h1:mb-4
                            prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3
                            prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-5 prose-h3:mb-3
                            prose-h4:text-base sm:prose-h4:text-lg prose-h4:mt-4 prose-h4:mb-2

                            prose-strong:text-white prose-strong:font-semibold
                            prose-em:text-white/80

                            prose-ul:my-3 prose-ul:space-y-1.5
                            prose-ol:my-3 prose-ol:space-y-1.5
                            prose-li:leading-[1.75] prose-li:text-[15px] sm:prose-li:text-base
                            [&_ul]:list-disc [&_ul]:pl-6
                            [&_ol]:list-decimal [&_ol]:pl-6
                            [&_li]:text-white/85 [&_li::marker]:text-white/40
                            [&_li_strong]:text-white

                            prose-code:text-blue-300 prose-code:bg-white/[0.08] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[14px] prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
                            prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:my-5 prose-pre:p-4 prose-pre:overflow-x-auto

                            prose-a:text-blue-400 prose-a:underline prose-a:underline-offset-2 prose-a:decoration-blue-400/40 hover:prose-a:decoration-blue-400

                            prose-blockquote:border-l-2 prose-blockquote:border-blue-500/50 prose-blockquote:pl-4 prose-blockquote:text-white/70 prose-blockquote:italic prose-blockquote:my-5

                            prose-hr:border-white/10 prose-hr:my-8"
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                          {message.isStreaming && <StreamingCursor />}
                        </div>
                      ) : message.isStreaming ? (
                        <div className="flex items-center gap-3 py-2">
                          {activeTool && getToolLogo(activeTool) ? (
                            <>
                              <div className="relative w-8 h-8 flex-shrink-0">
                                <div className="absolute inset-0 rounded-full bg-[#6e5dff]/10 animate-ping" />
                                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 animate-pulse">
                                  <Image
                                    src={getToolLogo(activeTool)!}
                                    alt={activeTool}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                              <span className="text-sm text-white/40">
                                {`Using ${activeTool.replace(/_/g, " ")}...`}
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="flex gap-1">
                                <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:0ms]" />
                                <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:150ms]" />
                                <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:300ms]" />
                              </div>
                              <span className="text-sm text-white/40">Thinking...</span>
                            </>
                          )}
                        </div>
                      ) : null}

                      {/* Bottom bar: action buttons + logo */}
                      {(message.isStreaming || message.content) && (
                        <div className="mt-4">
                          {/* Action buttons row — copy, like, dislike */}
                          {!message.isStreaming && message.content && (
                            <div className="flex items-center gap-1 mb-2">
                              <button
                                onClick={() => copyToClipboard(message.content, message.id)}
                                className="p-1.5 text-white/20 hover:text-white/50 transition-colors rounded-lg hover:bg-white/5"
                                title="Copy response"
                              >
                                {copiedId === message.id ? (
                                  <Check className="w-3.5 h-3.5 text-[#6e5dff] animate-in zoom-in duration-200" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => toggleReaction(message.id, "like")}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all",
                                  reactions[message.id] === "like"
                                    ? "text-[#6e5dff] bg-[#6e5dff]/10"
                                    : "text-white/20 hover:text-white/50 hover:bg-white/5"
                                )}
                                title="Helpful"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => toggleReaction(message.id, "dislike")}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all",
                                  reactions[message.id] === "dislike"
                                    ? "text-red-400 bg-red-500/10"
                                    : "text-white/20 hover:text-white/50 hover:bg-white/5"
                                )}
                                title="Not helpful"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Logo row */}
                          <div className={cn(
                            "flex items-center gap-2",
                            message.isStreaming && "animate-pulse"
                          )}>
                            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                              <Image
                                src={Logo}
                                alt="Logo"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {message.isStreaming && (
                              <span className="text-xs text-white/30">
                                {message.content ? "Streaming..." : ""}
                              </span>
                            )}
                            {!message.isStreaming && message.content && (
                              <span className="text-[10px] text-white/25">
                                {message.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />

            {/* Connection Confirmation Card — dark + green theme */}
            {confirmationData && (
              <div className="my-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#1a1a1a] border border-[#6e5dff]/15 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                  {/* Green accent top bar */}
                  <div className="h-1 bg-gradient-to-r from-[#6e5dff] via-[#6e5dff]/60 to-transparent" />

                  {/* Header */}
                  <div className="px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#6e5dff]/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-[#6e5dff]" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">
                          Confirm Connection Request
                        </h3>
                        <p className="text-white/40 text-sm">
                          Review your details before sending
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
                      <User className="w-4 h-4 text-[#6e5dff] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Name</p>
                        <p className="text-white text-sm font-medium">{confirmationData.details.name}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
                      <Mail className="w-4 h-4 text-[#6e5dff]/70 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Email</p>
                        <p className="text-white text-sm font-medium">{confirmationData.details.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
                      <Briefcase className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Reason</p>
                        <p className="text-white text-sm font-medium">{confirmationData.details.reason}</p>
                      </div>
                    </div>

                    {confirmationData.details.mobile_number && (
                      <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
                        <Phone className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Phone</p>
                          <p className="text-white text-sm font-medium">{confirmationData.details.mobile_number}</p>
                        </div>
                      </div>
                    )}

                    {confirmationData.details.about_user && (
                      <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
                        <FileText className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">About You</p>
                          <p className="text-white text-sm font-medium">{confirmationData.details.about_user}</p>
                        </div>
                      </div>
                    )}

                    {confirmationData.details.message && (
                      <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
                        <MessageSquare className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Message</p>
                          <p className="text-white text-sm font-medium italic">&ldquo;{confirmationData.details.message}&rdquo;</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-6 pb-5 flex gap-3">
                    <button
                      onClick={() => handleConnectionDecision("confirmed")}
                      disabled={isConfirming}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all",
                        "bg-[#6e5dff] text-white hover:bg-[#6e5dff]/80 active:scale-[0.98]",
                        isConfirming && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Check className="w-4 h-4" />
                      Send Connection
                    </button>
                    <button
                      onClick={() => handleConnectionDecision("cancelled")}
                      disabled={isConfirming}
                      className={cn(
                        "flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all",
                        "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white active:scale-[0.98]",
                        isConfirming && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>

                  <div className="px-6 pb-4">
                    <p className="text-white/25 text-xs text-center">
                      This will send a confirmation email to you and notify Krishna.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Connection Result Status Card */}
            {connectionResult && !confirmationData && (
              <div className="my-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button
                  onClick={() => setShowDetailPopup(true)}
                  className={cn(
                    "w-full text-left rounded-xl p-4 border transition-all hover:scale-[1.01] active:scale-[0.99]",
                    connectionResult.action === 'sent'
                      ? "bg-[#6e5dff]/5 border-[#6e5dff]/20 hover:border-[#6e5dff]/40"
                      : "bg-white/[0.02] border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {connectionResult.action === 'sent' ? (
                      <div className="w-8 h-8 rounded-full bg-[#6e5dff]/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-[#6e5dff]" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                        <XCircle className="w-4 h-4 text-white/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium",
                        connectionResult.action === 'sent' ? "text-[#6e5dff]" : "text-white/50"
                      )}>
                        {connectionResult.action === 'sent'
                          ? `Connection email sent to ${connectionResult.details.name}`
                          : 'Connection request cancelled'
                        }
                      </p>
                      <p className="text-xs text-white/30 mt-0.5">
                        {connectionResult.action === 'sent'
                          ? connectionResult.details.email
                          : 'No email was sent'
                        }
                      </p>
                    </div>
                    <Eye className="w-4 h-4 text-white/20 flex-shrink-0" />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Connection Detail Popup Modal */}
      {showDetailPopup && connectionResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowDetailPopup(false)}
        >
          <div
            className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={cn(
              "h-1",
              connectionResult.action === 'sent'
                ? "bg-gradient-to-r from-[#6e5dff] via-[#6e5dff]/60 to-transparent"
                : "bg-gradient-to-r from-white/20 via-white/10 to-transparent"
            )} />
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {connectionResult.action === 'sent' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#6e5dff]" />
                ) : (
                  <XCircle className="w-5 h-5 text-white/40" />
                )}
                <h3 className="text-white font-semibold">
                  {connectionResult.action === 'sent' ? 'Email Sent Successfully' : 'Request Cancelled'}
                </h3>
              </div>
              <button
                onClick={() => setShowDetailPopup(false)}
                className="p-1.5 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-3">
              <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
                <User className="w-4 h-4 text-[#6e5dff] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Name</p>
                  <p className="text-white text-sm font-medium">{connectionResult.details.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
                <Mail className="w-4 h-4 text-[#6e5dff]/70 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Email</p>
                  <p className="text-white text-sm font-medium">{connectionResult.details.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
                <Briefcase className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Reason</p>
                  <p className="text-white text-sm font-medium">{connectionResult.details.reason}</p>
                </div>
              </div>

              {connectionResult.details.mobile_number && (
                <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
                  <Phone className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Phone</p>
                    <p className="text-white text-sm font-medium">{connectionResult.details.mobile_number}</p>
                  </div>
                </div>
              )}

              {connectionResult.details.about_user && (
                <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
                  <FileText className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">About</p>
                    <p className="text-white text-sm font-medium">{connectionResult.details.about_user}</p>
                  </div>
                </div>
              )}

              {connectionResult.details.message && (
                <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
                  <MessageSquare className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Message</p>
                    <p className="text-white text-sm font-medium italic">&ldquo;{connectionResult.details.message}&rdquo;</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-5">
              <button
                onClick={() => setShowDetailPopup(false)}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 bg-red-500/15 border border-red-500/20 rounded-xl px-5 py-2.5 backdrop-blur-md">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Floating Input */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="bg-gradient-to-t bg-[#171717] pt-6 pb-4 sm:pb-6 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <PromptInput
              value={input}
              onValueChange={setInput}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              className="bg-[#1e1e1e] border-white/10 shadow-2xl shadow-black/50"
            >
              <PromptInputTextarea
                placeholder="Ask me about Krishna..."
                className="text-[15px] sm:text-base text-white placeholder:text-white/30 min-h-[48px]"
              />

              <PromptInputActions className="flex items-center justify-end gap-2 pt-2">
                <PromptInputAction
                  tooltip={isLoading ? "Stop generation" : "Send message"}
                >
                  <Button
                    variant="default"
                    size="icon"
                    className={cn(
                      "h-9 w-9 rounded-full transition-all",
                      isLoading
                        ? "bg-white/10 hover:bg-white/20"
                        : " bg-[#6e5dff] hover:bg-[#6e5dff]/80",
                      !isLoading &&
                        !input.trim() &&
                        "opacity-40 cursor-not-allowed"
                    )}
                    onClick={handleSubmit}
                    disabled={!isLoading && !input.trim()}
                  >
                    {isLoading ? (
                      <Square className="size-4 fill-white text-white" />
                    ) : (
                      <ArrowUp className="size-5 text-white" />
                    )}
                  </Button>
                </PromptInputAction>
              </PromptInputActions>
            </PromptInput>

           
          </div>
        </div>
      </div>
    </div>
  );
}
