import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { generateArticle } from '@/lib/ai/generate-article';

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
      include: {
        topic: true,
        city: true,
      },
    });

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (idea.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Idea must be accepted before generating article' },
        { status: 400 }
      );
    }

    // Check if article already exists for this topic/city combination
    if (idea.cityId) {
      const existingArticle = await db.article.findFirst({
        where: {
          tenantId: session.user.tenantId,
          topicId: idea.topicId,
          cityId: idea.cityId,
        },
      });

      if (existingArticle) {
        return NextResponse.json(
          { error: 'Article already exists for this topic and city' },
          { status: 400 }
        );
      }
    }

    // Generate article using the idea's suggested content
    const result = await generateArticle({
      tenantId: session.user.tenantId,
      topicId: idea.topicId,
      cityId: idea.cityId || undefined,
      suggestedTitle: idea.suggestedTitle,
      suggestedOutline: idea.suggestedOutline,
      seoKeywords: idea.seoKeywords,
      preview: false,
    });

    // Type guard to check if result is a full article (not preview)
    if (!('id' in result)) {
      return NextResponse.json(
        { error: 'Failed to create article' },
        { status: 500 }
      );
    }

    // Update idea status to GENERATED and link to article
    await db.articleIdea.update({
      where: { id: params.id },
      data: {
        status: 'GENERATED',
        articleId: result.id,
      },
    });

    return NextResponse.json({
      articleId: result.id,
      article: result,
    });
  } catch (error: any) {
    console.error('Error generating article from idea:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate article' },
      { status: 500 }
    );
  }
}
