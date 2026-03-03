"use client";

import React, { useState } from "react";
import Image from "next/image";
import logo from "@/Images/logo.png";
import {
  ArrowLeft,
  Bot,
  User as UserIcon,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const FASTAPI_URL =
  process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

type ChatMessage = {
  role: string;
  content: string;
  timestamp: string;
};

export default function ChatViewClient({
  sessionId,
  title,
  messages,
}: {
  sessionId: string;
  title: string;
  messages: ChatMessage[];
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleSummarize = async () => {
    if (summary) {
      setSummary(null);
      return;
    }
    setIsSummarizing(true);
    try {
      const res = await fetch(`${FASTAPI_URL}/portfolio/chat/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Summarize error:", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">{title}</h1>
              <p className="text-xs text-zinc-500">
                {messages.length} messages &middot; Session: {sessionId.slice(0, 24)}...
              </p>
            </div>
          </div>

          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#cde7c1]/70 bg-[#cde7c1]/5 border border-[#cde7c1]/15 rounded-xl hover:bg-[#cde7c1]/10 hover:text-[#cde7c1] transition-all disabled:opacity-50"
          >
            {isSummarizing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Image src={logo} alt="Logo" className="w-8 h-8" />
            )}
            {summary ? "Hide Summary" : "Summarize"}
          </button>
        </div>

        {/* Summary Banner */}
        {summary && (
          <div className="mb-6 p-4 bg-[#0d0d0d] border border-[#cde7c1]/10 rounded-xl">
            <div className="flex items-start gap-2">
              <Image src={logo} alt="Logo" className="w-8 h-8 text-[#cde7c1]/50 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-zinc-400 leading-relaxed">{summary}</p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-[#cde7c1]/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-[#cde7c1]" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-xl px-5 py-3 ${
                  msg.role === "user"
                    ? "bg-white/5 text-white/90 rounded-br-sm"
                    : "bg-[#111] text-zinc-300 border border-zinc-800 rounded-bl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
                <p className="text-[10px] text-zinc-600 mt-2">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 mt-1">
                  <UserIcon className="w-4 h-4 text-white/40" />
                </div>
              )}
            </div>
          ))}
        </div>

        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-zinc-500">No messages in this session.</p>
          </div>
        )}
      </div>
    </div>
  );
}
