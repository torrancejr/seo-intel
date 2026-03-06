import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ideas = await db.articleIdea.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        topic: true,
        city: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ ideas });
  } catch (error: any) {
    console.error('Error fetching ideas:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}
