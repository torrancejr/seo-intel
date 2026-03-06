import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateArticle } from '@/lib/ai/generate-article';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { topicId, cityIds, instructions, customInstructions } = body;
    
    // Accept either instructions or customInstructions
    const finalInstructions = instructions || customInstructions;

    if (!topicId || !cityIds || !Array.isArray(cityIds) || cityIds.length === 0) {
      return NextResponse.json(
        { error: 'Topic ID and city IDs are required' },
        { status: 400 }
      );
    }

    if (cityIds.length > 8) {
      return NextResponse.json(
        { error: 'Maximum 8 cities allowed per batch' },
        { status: 400 }
      );
    }

    // Check for existing articles with same topic + city combinations
    const existingArticles = await db.article.findMany({
      where: {
        tenantId: session.user.tenantId,
        topicId,
        cityId: { in: cityIds },
      },
      select: { cityId: true },
    });

    if (existingArticles.length > 0) {
      const existingCityIds = existingArticles.map(a => a.cityId);
      return NextResponse.json(
        {
          error: `Articles already exist for some cities. Please remove them from selection.`,
          existingCityIds,
        },
        { status: 400 }
      );
    }

    // Create batch record
    const batch = await db.generationBatch.create({
      data: {
        tenantId: session.user.tenantId,
        topicId,
        instructions: finalInstructions,
        totalArticles: cityIds.length,
        status: 'IN_PROGRESS',
        batchItems: {
          create: cityIds.map((cityId: string) => ({
            cityId,
            status: 'QUEUED',
          })),
        },
      },
      include: {
        batchItems: {
          include: {
            city: true,
          },
        },
      },
    });

    // Start background generation (don't await)
    processBatchGeneration(batch.id, session.user.tenantId, topicId, cityIds, finalInstructions);

    return NextResponse.json({
      success: true,
      batch: {
        id: batch.id,
        status: batch.status,
        totalArticles: batch.totalArticles,
        completedCount: batch.completedCount,
        failedCount: batch.failedCount,
        batchItems: batch.batchItems.map(item => ({
          id: item.id,
          cityId: item.cityId,
          status: item.status,
          city: item.city,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error creating batch:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create batch' },
      { status: 500 }
    );
  }
}

// Background processing function
async function processBatchGeneration(
  batchId: string,
  tenantId: string,
  topicId: string,
  cityIds: string[],
  instructions?: string
) {
  for (const cityId of cityIds) {
    try {
      // Update item status to GENERATING
      const batchItem = await db.generationBatchItem.findFirst({
        where: { batchId, cityId },
      });

      if (!batchItem) continue;

      await db.generationBatchItem.update({
        where: { id: batchItem.id },
        data: {
          status: 'GENERATING',
          startedAt: new Date(),
        },
      });

      // Generate article
      const article = await generateArticle({
        tenantId,
        topicId,
        cityId,
        customInstructions: instructions,
        preview: false,
      });

      // Update item status to COMPLETE
      await db.generationBatchItem.update({
        where: { id: batchItem.id },
        data: {
          status: 'COMPLETE',
          articleId: typeof article === 'object' && 'id' in article ? article.id : undefined,
          completedAt: new Date(),
        },
      });

      // Update batch completed count
      await db.generationBatch.update({
        where: { id: batchId },
        data: {
          completedCount: { increment: 1 },
        },
      });
    } catch (error: any) {
      console.error(`Error generating article for city ${cityId}:`, error);

      // Update item status to FAILED
      const batchItem = await db.generationBatchItem.findFirst({
        where: { batchId, cityId },
      });

      if (batchItem) {
        await db.generationBatchItem.update({
          where: { id: batchItem.id },
          data: {
            status: 'FAILED',
            error: error.message || 'Generation failed',
            completedAt: new Date(),
          },
        });

        // Update batch failed count
        await db.generationBatch.update({
          where: { id: batchId },
          data: {
            failedCount: { increment: 1 },
          },
        });
      }
    }
  }

  // Update batch status to COMPLETE or PARTIAL_FAILURE
  const batch = await db.generationBatch.findUnique({
    where: { id: batchId },
  });

  if (batch) {
    const finalStatus = batch.failedCount > 0 ? 'PARTIAL_FAILURE' : 'COMPLETE';
    await db.generationBatch.update({
      where: { id: batchId },
      data: { status: finalStatus },
    });
  }
}
