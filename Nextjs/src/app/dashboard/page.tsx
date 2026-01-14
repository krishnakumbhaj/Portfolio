import dbConnect from '@/lib/dbConnect';
import EmailModel from '@/models/Email';
import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import DashboardHeader from '@/components/DashboardHeader';
import EmailList from '@/components/EmailList';

type EmailItem = {
  _id: string;
  email: string;
  submittedAt: string | Date;
};

export default async function Page() {
  const session = await getServerSession(authOptions);

  await dbConnect();

  const rawEmails = await EmailModel.find()
    .sort({ submittedAt: -1 })
    .limit(200)
    .lean();

  const emails: EmailItem[] = rawEmails.map((e: { _id: unknown; email: string; submittedAt?: Date }) => ({
    _id: String(e._id),
    email: e.email,
    submittedAt: (e.submittedAt || new Date()).toString(),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header with gradient */}
        <div className="relative mb-8 rounded-2xl bg-gradient-to-r from-slate-800/50 via-slate-800/30 to-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 sm:p-8 overflow-hidden">
          {/* Accent line */}
          <div className="absolute top-0 right-0 w-1 h-20 bg-gradient-to-b from-orange-500 to-orange-600"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">Dashboard</h1>
                <p className="text-slate-400 text-sm">Manage your subscribers & email list</p>
              </div>
              
              {/* Stats card */}
              <div className="bg-slate-900/60 backdrop-blur border border-slate-700 rounded-xl px-6 py-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Subscribers</p>
                <p className="text-3xl font-bold text-orange-500">{emails.length}</p>
              </div>
            </div>

            <DashboardHeader username={session?.user?.username ?? null} email={session?.user?.email ?? null} />
          </div>
        </div>

        {/* Email list section */}
        <section className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1">Recent Subscribers</h2>
                <p className="text-sm text-slate-400">Showing up to 200 most recent emails</p>
              </div>
            </div>

            <EmailList initial={emails.map((e) => ({
              _id: e._id,
              email: e.email,
              submittedAt: new Date(e.submittedAt).toString(),
            }))} />
          </div>
        </section>
      </div>
    </div>
  );
}