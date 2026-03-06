import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idea = await db.articleIdea.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const updatedIdea = await db.articleIdea.update({
      where: { id: params.id },
      data: { status: 'ACCEPTED' },
      include: {
        topic: true,
        city: true,
      },
    });

    return NextResponse.json({ idea: updatedIdea });
  } catch (error: any) {
    console.error('Error accepting idea:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept idea' },
      { status: 500 }
    );
  }
}
