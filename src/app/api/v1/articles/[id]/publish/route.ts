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

    const article = await db.article.update({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({ article });
  } catch (error: any) {
    console.error('Error publishing article:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish article' },
      { status: 500 }
    );
  }
}
