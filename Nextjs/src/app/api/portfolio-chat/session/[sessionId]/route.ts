// API Route: Manage chat sessions (get history, delete session)
// Session-based, no auth required

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PortfolioChatModel from '@/models/PortfolioChat';

// GET: Fetch chat history for a session
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        await dbConnect();

        const chat = await PortfolioChatModel.findOne({ sessionId, isActive: true });

        if (!chat) {
            return NextResponse.json({
                success: true,
                chat: null,
                messages: [],
            });
        }

        return NextResponse.json({
            success: true,
            chat: {
                id: String(chat._id),
                sessionId: chat.sessionId,
                title: chat.title,
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt,
            },
            messages: chat.messages,
        });

    } catch (error) {
        console.error('Error fetching chat:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chat', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// DELETE: Clear/reset a session
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        await dbConnect();

        // Soft delete - mark as inactive
        await PortfolioChatModel.updateOne(
            { sessionId },
            { isActive: false }
        );

        return NextResponse.json({
            success: true,
            message: `Session ${sessionId} cleared`,
        });

    } catch (error) {
        console.error('Error deleting session:', error);
        return NextResponse.json(
            { error: 'Failed to delete session', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
