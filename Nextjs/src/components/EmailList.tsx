"use client";
import React, { useState } from "react";

type EmailItem = {
  _id: string;
  email: string;
  submittedAt: string;
};

export default function EmailList({ initial }: { initial: EmailItem[] }) {
  const [emails, setEmails] = useState<EmailItem[]>(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this email subscriber?")) return;
    try {
      setLoadingId(id);
      const res = await fetch(`/api/emails/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setEmails((prev) => prev.filter((e) => e._id !== id));
      } else {
        alert(data?.error || data?.message || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {emails.length === 0 && (
        <div className="py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-400 text-lg">No subscribers yet</p>
          <p className="text-slate-500 text-sm mt-1">Start collecting emails to see them here</p>
        </div>
      )}

      {emails.map((item, index) => (
        <div 
          key={item._id} 
          className="group relative bg-slate-800/30 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 rounded-xl p-4 sm:p-5 transition-all duration-200 hover:shadow-lg"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
                  {item.email.charAt(0).toUpperCase()}
                </div>
                <div className="font-medium text-white text-base">{item.email}</div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 ml-11">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(item.submittedAt).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {item._id.slice(-6)}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleDelete(item._id)}
              disabled={loadingId === item._id}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-red-500/10"
            >
              {loadingId === item._id ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </span>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
