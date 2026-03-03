import mongoose, { Schema, Document } from 'mongoose';

// =============================================================================
// PORTFOLIO CONNECTION SCHEMA
// =============================================================================
// This schema stores connection requests from portfolio visitors
// Data flows: User Chat → FastAPI → Next.js API → MongoDB

export interface IPortfolioConnection extends Document {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    role?: string;
    reason: string;
    message?: string;
    aboutUser?: string;
    sessionId?: string;
    status: 'pending' | 'contacted' | 'completed' | 'archived';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PortfolioConnectionSchema: Schema<IPortfolioConnection> = new Schema({
    // Required fields
    name: { 
        type: String, 
        required: [true, "Name is required"], 
        trim: true,
        minlength: [2, "Name must be at least 2 characters"]
    },
    email: { 
        type: String, 
        required: [true, "Email is required"], 
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    
    // Optional fields
    phone: { 
        type: String, 
        trim: true 
    },
    company: { 
        type: String, 
        trim: true 
    },
    role: { 
        type: String, 
        trim: true 
    },
    reason: { 
        type: String, 
        required: [true, "Reason is required"],
        trim: true,
        default: "Connection request"
    },
    message: { 
        type: String, 
        trim: true 
    },
    aboutUser: {
        type: String,
        trim: true
    },
    
    // Tracking fields
    sessionId: { 
        type: String, 
        trim: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'contacted', 'completed', 'archived'],
        default: 'pending'
    },
    notes: { 
        type: String, 
        trim: true 
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Create index for faster queries
PortfolioConnectionSchema.index({ email: 1 });
PortfolioConnectionSchema.index({ status: 1 });
PortfolioConnectionSchema.index({ createdAt: -1 });

const PortfolioConnectionModel = 
    (mongoose.models.PortfolioConnection as mongoose.Model<IPortfolioConnection>) ||
    mongoose.model<IPortfolioConnection>('PortfolioConnection', PortfolioConnectionSchema);

export default PortfolioConnectionModel;
