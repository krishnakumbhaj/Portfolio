"use client";

import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  FileText,
  MessageSquare,
  X,
  Eye,
  ExternalLink,
} from "lucide-react";

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

export default function ConnectionsList({
  initial,
}: {
  initial: ConnectionItem[];
}) {
  const [connections] = useState<ConnectionItem[]>(initial);
  const [selectedConn, setSelectedConn] = useState<ConnectionItem | null>(null);

  return (
    <>
      {connections.length === 0 ? (
        <div className="py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4">
            <User className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-zinc-400 text-lg">No connection requests yet</p>
          <p className="text-zinc-500 text-sm mt-1">
            Visitors can connect through the portfolio AI chat
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map((conn) => (
            <div
              key={conn._id}
              className="group bg-[#111] border border-zinc-800 rounded-xl p-5 hover:border-[#cde7c1]/20 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#cde7c1]/20 to-[#cde7c1]/5 flex items-center justify-center text-sm font-bold text-[#cde7c1]">
                      {conn.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-white truncate">
                        {conn.name}
                      </h3>
                      <p className="text-xs text-zinc-500">{conn.email}</p>
                    </div>
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        conn.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          : conn.status === "contacted"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : conn.status === "completed"
                          ? "bg-[#cde7c1]/10 text-[#cde7c1] border border-[#cde7c1]/20"
                          : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                      }`}
                    >
                      {conn.status}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-400 ml-12">
                    <span className="text-zinc-500">Reason:</span> {conn.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-12 sm:ml-0">
                  <button
                    onClick={() => setSelectedConn(conn)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/60 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Details
                  </button>

                  {conn.sessionId && (
                    <a
                      href={`/dashboard/chat/${conn.sessionId}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#cde7c1]/70 bg-[#cde7c1]/5 border border-[#cde7c1]/15 rounded-lg hover:bg-[#cde7c1]/10 hover:text-[#cde7c1] transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Chat
                    </a>
                  )}

                  <p className="text-xs text-zinc-600 whitespace-nowrap hidden sm:block">
                    {new Date(conn.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedConn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedConn(null)}
        >
          <div
            className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 bg-gradient-to-r from-[#cde7c1] via-[#cde7c1]/60 to-transparent" />

            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#cde7c1]/10 flex items-center justify-center text-sm font-bold text-[#cde7c1]">
                  {selectedConn.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    {selectedConn.name}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Connection Request
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedConn(null)}
                className="p-1.5 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <DetailRow
                icon={<User className="w-4 h-4 text-[#cde7c1]" />}
                label="Name"
                value={selectedConn.name}
              />
              <DetailRow
                icon={<Mail className="w-4 h-4 text-[#cde7c1]/70" />}
                label="Email"
                value={selectedConn.email}
              />
              <DetailRow
                icon={<Briefcase className="w-4 h-4 text-white/40" />}
                label="Reason"
                value={selectedConn.reason}
              />
              {selectedConn.phone && (
                <DetailRow
                  icon={<Phone className="w-4 h-4 text-white/40" />}
                  label="Phone"
                  value={selectedConn.phone}
                />
              )}
              {selectedConn.aboutUser && (
                <DetailRow
                  icon={<FileText className="w-4 h-4 text-white/40" />}
                  label="About"
                  value={selectedConn.aboutUser}
                />
              )}
              {selectedConn.message && (
                <DetailRow
                  icon={<MessageSquare className="w-4 h-4 text-white/40" />}
                  label="Message"
                  value={selectedConn.message}
                  italic
                />
              )}
            </div>

            <div className="px-6 pb-5 flex gap-3">
              {selectedConn.sessionId && (
                <a
                  href={`/dashboard/chat/${selectedConn.sessionId}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-[#cde7c1]/10 text-[#cde7c1] border border-[#cde7c1]/20 hover:bg-[#cde7c1]/15 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Full Chat
                </a>
              )}
              <button
                onClick={() => setSelectedConn(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
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

function DetailRow({
  icon,
  label,
  value,
  italic,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  italic?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p
          className={`text-white text-sm font-medium ${italic ? "italic" : ""}`}
        >
          {italic ? `\u201c${value}\u201d` : value}
        </p>
      </div>
    </div>
  );
}
