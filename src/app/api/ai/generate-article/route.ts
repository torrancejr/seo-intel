import { auth } from '@/lib/auth';
import { generateArticle } from '@/lib/ai/generate-article';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topicId, cityId, customInstructions, preview } = await request.json();

    if (!topicId || !cityId) {
      return NextResponse.json(
        { error: 'Topic ID and City ID are required' },
        { status: 400 }
      );
    }

    // If not preview mode, check if article already exists
    if (!preview) {
      const { db } = await import('@/lib/db');
      const existing = await db.article.findFirst({
        where: {
          tenantId: session.user.tenantId,
          topicId,
          cityId,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Article already exists for this topic and city' },
          { status: 400 }
        );
      }
    }

    const article = await generateArticle({
      tenantId: session.user.tenantId,
      topicId,
      cityId,
      customInstructions,
      preview: preview || false,
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (error: any) {
    console.error('Error generating article:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate article' },
      { status: 500 }
    );
  }
}
