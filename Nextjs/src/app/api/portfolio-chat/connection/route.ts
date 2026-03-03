// API Route: Store portfolio connection requests (no auth required)
// Called by FastAPI email tool after sending confirmation emails

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PortfolioConnectionModel from '@/models/PortfolioConnection';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, phone, reason, message, aboutUser, sessionId } = body;

        if (!name || !email || !reason) {
            return NextResponse.json(
                { error: 'Missing required fields: name, email, and reason are required' },
                { status: 400 }
            );
        }

        // Basic email validation
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email address format' },
                { status: 400 }
            );
        }

        await dbConnect();

        const connection = await PortfolioConnectionModel.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone?.trim() || undefined,
            reason: reason.trim(),
            message: message?.trim() || undefined,
            aboutUser: aboutUser?.trim() || undefined,
            sessionId: sessionId || undefined,
            status: 'pending',
        });

        console.log(`✅ Connection stored: ${name} (${email})`);

        return NextResponse.json(
            { 
                success: true, 
                message: 'Connection request stored successfully',
                connectionId: String(connection._id)
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('❌ Error storing connection:', error);
        return NextResponse.json(
            { error: 'Failed to store connection request' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        await dbConnect();

        const connections = await PortfolioConnectionModel.find()
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();

        return NextResponse.json({ 
            success: true, 
            connections,
            total: connections.length 
        });
    } catch (error) {
        console.error('❌ Error fetching connections:', error);
        return NextResponse.json(
            { error: 'Failed to fetch connections' },
            { status: 500 }
        );
    }
}
