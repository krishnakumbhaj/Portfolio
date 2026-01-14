import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import EmailModel from "@/models/Email";

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const { email } = await request.json();

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await EmailModel.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (existingEmail) {
      return NextResponse.json(
        { 
          success: false, 
          message: "This email is already subscribed" 
        },
        { status: 409 }
      );
    }

    // Save new email
    const newEmail = new EmailModel({
      email: email.toLowerCase().trim(),
      submittedAt: new Date()
    });

    await newEmail.save();

    return NextResponse.json(
      {
        success: true,
        message: "Email submitted successfully! We'll be in touch soon.",
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error("Error saving email:", error);

    // Handle duplicate key error (in case of race condition)
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          message: "This email is already subscribed" 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit email. Please try again later.",
      },
      { status: 500 }
    );
  }
}
