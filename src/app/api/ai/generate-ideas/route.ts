import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { generateArticleIdeas } from '@/lib/ai/generate-ideas';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topicId, cityIds, count } = await request.json();

    if (!topicId || !cityIds || cityIds.length === 0) {
      return NextResponse.json(
        { error: 'Topic ID and at least one city are required' },
        { status: 400 }
      );
    }

    // Generate ideas
    const ideas = await generateArticleIdeas({
      tenantId: session.user.tenantId,
      topicId,
      cityIds,
      count: count || 3,
    });

    // Save ideas to database
    const savedIdeas = await Promise.all(
      ideas.map(async (idea) => {
        // For each city, create an idea
        const cityIdeasPromises = cityIds.map((cityId: string) =>
          db.articleIdea.create({
            data: {
              tenantId: session.user.tenantId,
              topicId,
              cityId,
              suggestedTitle: idea.suggestedTitle,
              suggestedOutline: idea.suggestedOutline,
              seoKeywords: idea.seoKeywords,
              estimatedVolume: idea.estimatedVolume,
              status: 'SUGGESTED',
            },
            include: {
              topic: true,
              city: true,
            },
          })
        );
        return Promise.all(cityIdeasPromises);
      })
    );

    return NextResponse.json({
      ideas: savedIdeas.flat(),
      count: savedIdeas.flat().length,
    });
  } catch (error: any) {
    console.error('Error generating ideas:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate ideas' },
      { status: 500 }
    );
  }
}
