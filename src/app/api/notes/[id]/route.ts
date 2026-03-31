import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Note from '@/models/Note';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, tags } = await req.json();

    await dbConnect();
    const note = await Note.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { title, content, tags },
      { new: true }
    );

    if (!note) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unknown error occurred' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const result = await Note.deleteOne({ _id: id, userId: session.user.id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Note deleted' });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unknown error occurred' }, 
      { status: 500 }
    );
  }
}
