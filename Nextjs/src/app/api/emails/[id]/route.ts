import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/dbConnect';
import EmailModel from '@/models/Email';
import { Types } from 'mongoose';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id?: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    await dbConnect();

    const deleted = await EmailModel.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Email not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Email deleted' });
  } catch (error) {
    console.error('Error deleting email:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete email' }, { status: 500 });
  }
}
