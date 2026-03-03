"use client";

import React, { useState } from "react";
import { signOut } from "next-auth/react";
import {
  Mail,
  MessageSquare,
  Users,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import EmailList from "@/components/EmailList";
import ConnectionsList from "@/components/ConnectionsList";
import ChatsList from "@/components/ChatsList";

// =============================================================================
// TYPES
// =============================================================================

type EmailItem = {
  _id: string;
  email: string;
  submittedAt: string;
};

type ConnectionItem = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  reason: string;
  message?: string;
  aboutUser?: string;
  sessionId?: string;
  status: string;
  createdAt: string;
};

type ChatItem = {
  _id: string;
  sessionId: string;
  title: string;
  messageCount: number;
  preview: string;
  createdAt: string;
  updatedAt: string;
};

type Tab = "overview" | "connections" | "chats" | "subscribers";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "connections", label: "Connections", icon: Users },
  { id: "chats", label: "AI Chats", icon: MessageSquare },
  { id: "subscribers", label: "Subscribers", icon: Mail },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function DashboardClient({
  emails,
  connections,
  chats,
  username,
  userEmail,
}: {
  emails: EmailItem[];
  connections: ConnectionItem[];
  chats: ChatItem[];
  username: string | null;
  userEmail: string | null;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = [
    { label: "Subscribers", value: emails.length, tab: "subscribers" as Tab },
    { label: "Chats", value: chats.length, tab: "chats" as Tab },
    { label: "Connections", value: connections.length, tab: "connections" as Tab },
  ];

  return (
    <div className="h-dvh bg-[#282828] flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-[#1e1e1e] border-r border-white/5
          flex flex-col
          transform transition-transform duration-200 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Sidebar header */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#cde7c1]/15 flex items-center justify-center text-sm font-bold text-[#cde7c1]">
                {username ? username.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {username ?? "User"}
                </p>
                <p className="text-xs text-white/30 truncate">
                  {userEmail ?? "—"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-white/30 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${
                    isActive
                      ? "bg-[#cde7c1]/10 text-[#cde7c1] border border-[#cde7c1]/15"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
                {isActive && (
                  <ChevronRight className="w-3 h-3 ml-auto" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 border-b border-white/5 bg-[#282828] px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">
              {TABS.find((t) => t.id === activeTab)?.label ?? "Dashboard"}
            </h1>
          </div>
        </header>

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Overview tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Stats grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map((stat) => (
                  <button
                    key={stat.label}
                    onClick={() => setActiveTab(stat.tab)}
                    className="group bg-[#1e1e1e] border border-white/5 rounded-xl p-5 text-left hover:border-[#cde7c1]/20 transition-all"
                  >
                    <p className="text-xs text-white/30 uppercase tracking-widest mb-2 font-semibold">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-[#cde7c1]">
                      {stat.value}
                    </p>
                  </button>
                ))}
              </div>

              {/* Quick preview: Connections */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Recent Connections
                  </h2>
                  <button
                    onClick={() => setActiveTab("connections")}
                    className="text-xs text-[#cde7c1]/60 hover:text-[#cde7c1] transition-colors"
                  >
                    View all &rarr;
                  </button>
                </div>
                <div className="bg-[#1e1e1e] border border-white/5 rounded-xl p-5">
                  <ConnectionsList initial={connections.slice(0, 3)} />
                </div>
              </section>

              {/* Quick preview: Chats */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Recent Chats
                  </h2>
                  <button
                    onClick={() => setActiveTab("chats")}
                    className="text-xs text-[#cde7c1]/60 hover:text-[#cde7c1] transition-colors"
                  >
                    View all &rarr;
                  </button>
                </div>
                <div className="bg-[#1e1e1e] border border-white/5 rounded-xl p-5">
                  <ChatsList initial={chats.slice(0, 3)} />
                </div>
              </section>

              {/* Quick preview: Subscribers */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Recent Subscribers
                  </h2>
                  <button
                    onClick={() => setActiveTab("subscribers")}
                    className="text-xs text-[#cde7c1]/60 hover:text-[#cde7c1] transition-colors"
                  >
                    View all &rarr;
                  </button>
                </div>
                <div className="bg-[#1e1e1e] border border-white/5 rounded-xl p-5">
                  <EmailList initial={emails.slice(0, 3)} />
                </div>
              </section>
            </div>
          )}

          {/* Connections tab */}
          {activeTab === "connections" && (
            <div className="bg-[#1e1e1e] border border-white/5 rounded-xl p-5 sm:p-8">
              <div className="mb-6 pb-4 border-b border-white/5">
                <h2 className="text-xl font-bold text-white mb-1">
                  Connection Requests
                </h2>
                <p className="text-sm text-white/30">
                  Visitors who want to connect via AI chat
                </p>
              </div>
              <ConnectionsList initial={connections} />
            </div>
          )}

          {/* Chats tab */}
          {activeTab === "chats" && (
            <div className="bg-[#1e1e1e] border border-white/5 rounded-xl p-5 sm:p-8">
              <div className="mb-6 pb-4 border-b border-white/5">
                <h2 className="text-xl font-bold text-white mb-1">
                  AI Chat Sessions
                </h2>
                <p className="text-sm text-white/30">
                  All portfolio chat conversations &mdash; view or summarize
                </p>
              </div>
              <ChatsList initial={chats} />
            </div>
          )}

          {/* Subscribers tab */}
          {activeTab === "subscribers" && (
            <div className="bg-[#1e1e1e] border border-white/5 rounded-xl p-5 sm:p-8">
              <div className="mb-6 pb-4 border-b border-white/5">
                <h2 className="text-xl font-bold text-white mb-1">
                  Email Subscribers
                </h2>
                <p className="text-sm text-white/30">
                  Collected from the portfolio landing page
                </p>
              </div>
              <EmailList initial={emails} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
