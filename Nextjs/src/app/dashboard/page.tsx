import dbConnect from '@/lib/dbConnect';
import EmailModel from '@/models/Email';
import PortfolioConnectionModel from '@/models/PortfolioConnection';
import PortfolioChatModel from '@/models/PortfolioChat';
import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import DashboardClient from '@/components/DashboardClient';

type EmailItem = {
  _id: string;
  email: string;
  submittedAt: string | Date;
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

export default async function Page() {
  const session = await getServerSession(authOptions);

  await dbConnect();

  // Fetch emails
  const rawEmails = await EmailModel.find()
    .sort({ submittedAt: -1 })
    .limit(200)
    .lean();

  const emails: EmailItem[] = rawEmails.map((e: { _id: unknown; email: string; submittedAt?: Date }) => ({
    _id: String(e._id),
    email: e.email,
    submittedAt: (e.submittedAt || new Date()).toString(),
  }));

  // Fetch connections
  const rawConnections = await PortfolioConnectionModel.find()
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const connections: ConnectionItem[] = rawConnections.map((c: Record<string, unknown>) => ({
    _id: String(c._id),
    name: c.name as string,
    email: c.email as string,
    phone: (c.phone as string) || undefined,
    reason: c.reason as string,
    message: (c.message as string) || undefined,
    aboutUser: (c.aboutUser as string) || undefined,
    sessionId: (c.sessionId as string) || undefined,
    status: (c.status as string) || 'pending',
    createdAt: (c.createdAt as Date || new Date()).toString(),
  }));

  // Fetch portfolio chats
  const rawChats = await PortfolioChatModel.find({ isActive: true })
    .sort({ updatedAt: -1 })
    .limit(200)
    .lean();

  const chats: ChatItem[] = rawChats.map((chat: Record<string, unknown>) => ({
    _id: String(chat._id),
    sessionId: chat.sessionId as string,
    title: (chat.title as string) || 'New Chat',
    messageCount: Array.isArray(chat.messages) ? chat.messages.length : 0,
    preview: Array.isArray(chat.messages)
      ? ((chat.messages.find((m: Record<string, unknown>) => m.role === 'user') as Record<string, unknown>)?.content as string || '').substring(0, 100)
      : '',
    createdAt: (chat.createdAt as Date || new Date()).toString(),
    updatedAt: (chat.updatedAt as Date || new Date()).toString(),
  }));

  return (
    <DashboardClient
      emails={emails.map((e) => ({
        _id: e._id,
        email: e.email,
        submittedAt: new Date(e.submittedAt).toString(),
      }))}
      connections={connections}
      chats={chats}
      username={session?.user?.username ?? null}
      userEmail={session?.user?.email ?? null}
    />
  );
}