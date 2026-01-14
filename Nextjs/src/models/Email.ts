import mongoose, { Schema, Document } from "mongoose";

export interface Email extends Document {
  email: string;
  submittedAt: Date;
}

const EmailSchema: Schema<Email> = new Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email address"
    ]
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const EmailModel = 
  (mongoose.models.Email as mongoose.Model<Email>) || 
  mongoose.model<Email>("Email", EmailSchema);

export default EmailModel;
