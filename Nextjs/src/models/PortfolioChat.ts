// Model: Portfolio Chat (Session-based, no user auth required)
// Stores chat history for portfolio visitors using sessionId

import mongoose, { Schema, Document } from 'mongoose';

export interface IPortfolioChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface IPortfolioChat extends Document {
    sessionId: string;
    title: string;
    messages: IPortfolioChatMessage[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PortfolioChatMessageSchema = new Schema<IPortfolioChatMessage>({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const PortfolioChatSchema = new Schema<IPortfolioChat>({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    title: {
        type: String,
        default: 'New Chat',
        trim: true,
    },
    messages: [PortfolioChatMessageSchema],
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Update timestamp on save
PortfolioChatSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Index for faster queries
PortfolioChatSchema.index({ sessionId: 1, isActive: 1 });
PortfolioChatSchema.index({ createdAt: -1 });

const PortfolioChatModel =
    (mongoose.models.PortfolioChat as mongoose.Model<IPortfolioChat>) ||
    mongoose.model<IPortfolioChat>('PortfolioChat', PortfolioChatSchema);

export default PortfolioChatModel;
