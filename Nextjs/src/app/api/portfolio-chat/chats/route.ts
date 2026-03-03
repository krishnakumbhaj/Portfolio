// API Route: Get all portfolio chat sessions
// Used by dashboard to display chat history

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PortfolioChatModel from '@/models/PortfolioChat';

export async function GET() {
    try {
        await dbConnect();

        const chats = await PortfolioChatModel.find({ isActive: true })
            .sort({ updatedAt: -1 })
            .limit(200)
            .lean();

        const formatted = chats.map((chat: Record<string, unknown>) => ({
            _id: String(chat._id),
            sessionId: chat.sessionId as string,
            title: (chat.title as string) || 'New Chat',
            messageCount: Array.isArray(chat.messages) ? chat.messages.length : 0,
            // First user message preview
            preview: Array.isArray(chat.messages)
                ? (chat.messages.find((m: Record<string, unknown>) => m.role === 'user')?.content as string || '').substring(0, 100)
                : '',
            createdAt: (chat.createdAt as Date || new Date()).toString(),
            updatedAt: (chat.updatedAt as Date || new Date()).toString(),
        }));

        return NextResponse.json({
            success: true,
            chats: formatted,
            total: formatted.length,
        });
    } catch (error) {
        console.error('Error fetching chats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chats' },
            { status: 500 }
        );
    }
}
