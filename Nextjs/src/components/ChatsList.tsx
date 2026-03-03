"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  X,
  ExternalLink,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Bot,
} from "lucide-react";
import Image from "next/image";
import logo from "@/Images/logo.png";
const FASTAPI_URL =
  process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

type ChatItem = {
  _id: string;
  sessionId: string;
  title: string;
  messageCount: number;
  preview: string;
  createdAt: string;
  updatedAt: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export default function ChatsList({ initial }: { initial: ChatItem[] }) {
  const [chats] = useState<ChatItem[]>(initial);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const [expandedChat, setExpandedChat] = useState<string | null>(null);

  const viewChat = async (chat: ChatItem) => {
    setSelectedChat(chat);
    setIsLoadingMessages(true);
    setChatMessages([]);

    try {
      const res = await fetch(
        `/api/portfolio-chat/session/${chat.sessionId}`
      );
      const data = await res.json();
      if (data.success && data.messages) {
        setChatMessages(data.messages);
      }
    } catch (err) {
      console.error("Error loading chat:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const summarizeChat = async (sessionId: string) => {
    if (summaries[sessionId]) {
      // Already have summary, just toggle expand
      setExpandedChat(expandedChat === sessionId ? null : sessionId);
      return;
    }

    setSummarizing(sessionId);
    try {
      const res = await fetch(`${FASTAPI_URL}/portfolio/chat/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        setSummaries((prev) => ({ ...prev, [sessionId]: data.summary }));
        setExpandedChat(sessionId);
      }
    } catch (err) {
      console.error("Summarize error:", err);
    } finally {
      setSummarizing(null);
    }
  };

  return (
    <>
      {chats.length === 0 ? (
        <div className="py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4">
            <MessageSquare className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-zinc-400 text-lg">No chat sessions yet</p>
          <p className="text-zinc-500 text-sm mt-1">
            Conversations will appear here when visitors use the AI chat
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => (
            <div key={chat._id}>
              <div className="group bg-[#111] border border-zinc-800 rounded-xl p-5 hover:border-[#cde7c1]/20 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-white/40" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-white truncate max-w-[300px]">
                          {chat.title}
                        </h3>
                        <p className="text-xs text-zinc-600">
                          {chat.messageCount} messages &middot;{" "}
                          {new Date(chat.updatedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {chat.preview && (
                      <p className="text-xs text-zinc-500 ml-11 truncate max-w-[400px]">
                        {chat.preview}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-11 sm:ml-0">
                    <button
                      onClick={() => summarizeChat(chat.sessionId)}
                      disabled={summarizing === chat.sessionId}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/60 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                    >
                      {summarizing === chat.sessionId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Image src={logo} alt="Logo" className="w-3.5 h-3.5" />
                      )}
                      {summaries[chat.sessionId] ? (
                        expandedChat === chat.sessionId ? (
                          <><ChevronUp className="w-3 h-3" /> Hide</>
                        ) : (
                          <><ChevronDown className="w-3 h-3" /> Summary</>
                        )
                      ) : (
                        "Summarize"
                      )}
                    </button>

                    <button
                      onClick={() => viewChat(chat)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#cde7c1]/70 bg-[#cde7c1]/5 border border-[#cde7c1]/15 rounded-lg hover:bg-[#cde7c1]/10 hover:text-[#cde7c1] transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Chat
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary expand */}
              {expandedChat === chat.sessionId && summaries[chat.sessionId] && (
                <div className="mt-1 ml-6 mr-2 p-4 bg-[#0d0d0d] border border-zinc-800/50 rounded-xl">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#cde7c1]/50 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {summaries[chat.sessionId]}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chat View Modal */}
      {selectedChat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedChat(null)}
        >
          <div
            className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 bg-gradient-to-r from-[#cde7c1] via-[#cde7c1]/60 to-transparent" />

            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-white font-semibold">
                  {selectedChat.title}
                </h3>
                <p className="text-xs text-zinc-500">
                  {selectedChat.messageCount} messages &middot; Session:{" "}
                  {selectedChat.sessionId.slice(0, 20)}...
                </p>
              </div>
              <button
                onClick={() => setSelectedChat(null)}
                className="p-1.5 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              {isLoadingMessages ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 mx-auto mb-2 text-[#cde7c1] animate-spin" />
                  <p className="text-sm text-zinc-500">Loading messages...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <p className="text-center text-zinc-500 py-8">
                  No messages found.
                </p>
              ) : (
                chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-[#cde7c1]/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-3.5 h-3.5 text-[#cde7c1]" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                        msg.role === "user"
                          ? "bg-white/5 text-white/90 rounded-br-sm"
                          : "bg-[#111] text-zinc-300 border border-zinc-800 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-1.5">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 mt-1">
                        <UserIcon className="w-3.5 h-3.5 text-white/40" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/5 flex-shrink-0">
              <button
                onClick={() => setSelectedChat(null)}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
