// API Route: Store chat messages (session-based, no auth required)
// This endpoint is called by FastAPI to persist chat history

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PortfolioChatModel from '@/models/PortfolioChat';

export async function POST(request: NextRequest) {
    try {
        const { session_id, user_message, ai_response, timestamp } = await request.json();

        if (!session_id || !user_message || !ai_response) {
            return NextResponse.json(
                { error: 'Missing required fields: session_id, user_message, ai_response' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find or create chat session
        let chat = await PortfolioChatModel.findOne({ sessionId: session_id });

        if (!chat) {
            // Create new chat session
            chat = new PortfolioChatModel({
                sessionId: session_id,
                messages: [],
                createdAt: new Date(timestamp || Date.now()),
            });
        }

        // Add user message
        chat.messages.push({
            role: 'user',
            content: user_message,
            timestamp: new Date(timestamp || Date.now()),
        });

        // Add AI response
        chat.messages.push({
            role: 'assistant',
            content: ai_response,
            timestamp: new Date(),
        });

        // Update title from first user message if not set
        if (!chat.title && user_message) {
            chat.title = user_message.substring(0, 50) + (user_message.length > 50 ? '...' : '');
        }

        await chat.save();

        return NextResponse.json({
            success: true,
            message: 'Chat stored successfully',
            chatId: String(chat._id),
        });

    } catch (error) {
        console.error('Error storing chat:', error);
        return NextResponse.json(
            { error: 'Failed to store chat', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
