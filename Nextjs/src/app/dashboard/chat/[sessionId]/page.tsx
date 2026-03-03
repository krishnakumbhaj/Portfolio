// Dashboard Chat View — View full chat by session ID
// Route: /dashboard/chat/[sessionId]

import dbConnect from '@/lib/dbConnect';
import PortfolioChatModel from '@/models/PortfolioChat';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import ChatViewClient from '@/components/ChatViewClient';

export default async function ChatViewPage({
    params,
}: {
    params: Promise<{ sessionId: string }>;
}) {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/sign-in');

    const { sessionId } = await params;

    await dbConnect();

    const chat = await PortfolioChatModel.findOne({ sessionId }).lean();

    if (!chat) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Chat Not Found</h1>
                    <p className="text-zinc-500 mb-6">Session ID: {sessionId}</p>
                    <a href="/dashboard" className="text-[#cde7c1] hover:underline text-sm">
                        &larr; Back to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    const messages = Array.isArray(chat.messages)
        ? chat.messages.map((m: Record<string, unknown>) => ({
            role: m.role as string,
            content: m.content as string,
            timestamp: (m.timestamp as Date || new Date()).toString(),
        }))
        : [];

    return (
        <ChatViewClient
            sessionId={sessionId}
            title={(chat.title as string) || 'Chat'}
            messages={messages}
        />
    );
}
