"use client";
import React from "react";
import { signOut } from "next-auth/react";

export default function DashboardHeader({
  username,
  email,
}: {
  username?: string | null;
  email?: string | null;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-base font-bold text-white shadow-lg">
            {username ? username.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-slate-800"></div>
        </div>
        <div>
          <div className="text-base font-semibold text-white">{username ?? "User"}</div>
          <div className="text-sm text-slate-400">{email ?? "—"}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => signOut({ callbackUrl: '/sign-in' })}
          className="px-5 py-2.5 bg-slate-800 border border-slate-700 text-sm font-medium rounded-lg hover:bg-slate-700 hover:border-slate-600 transition-all duration-200 shadow-lg hover:shadow-orange-500/10"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
