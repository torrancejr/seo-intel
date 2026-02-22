import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topicId, cityIds, customInstructions } = await request.json();

    console.log('📦 Batch generation request:', { topicId, cityIds: cityIds?.length, customInstructions });

    if (!topicId || !cityIds || cityIds.length === 0) {
      return NextResponse.json(
        { error: 'Topic ID and at least one city are required' },
        { status: 400 }
      );
    }

    if (cityIds.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 cities per batch' },
        { status: 400 }
      );
    }

    // Create batch job
    const batch = await db.generationBatch.create({
      data: {
        tenantId: session.user.tenantId,
        topicId,
        instructions: customInstructions,
        totalArticles: cityIds.length,
        batchItems: {
          create: cityIds.map((cityId: string) => ({
            cityId,
            status: 'QUEUED',
          })),
        },
      },
      include: {
        batchItems: true,
      },
    });

    console.log('✅ Batch created:', batch.id);

    // Start processing in the background (we'll process one at a time)
    // In production, you'd use a proper job queue like BullMQ or Inngest
    processBatchInBackground(batch.id);

    return NextResponse.json({ batchId: batch.id }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating batch:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create batch' },
      { status: 500 }
    );
  }
}

// Background processing function
async function processBatchInBackground(batchId: string) {
  // Don't await this - let it run in the background
  processBatch(batchId).catch(error => {
    console.error('Batch processing error:', error);
  });
}

async function processBatch(batchId: string) {
  const batch = await db.generationBatch.findUnique({
    where: { id: batchId },
    include: {
      batchItems: {
        where: { status: 'QUEUED' },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!batch) return;

  for (const item of batch.batchItems) {
    try {
      // Check if article already exists for this combination
      const existingArticle = await db.article.findUnique({
        where: {
          tenantId_topicId_cityId: {
            tenantId: batch.tenantId,
            topicId: batch.topicId,
            cityId: item.cityId,
          },
        },
      });

      if (existingArticle) {
        console.log(`⏭️  Skipping ${item.cityId} - article already exists`);
        
        // Mark as complete with existing article
        await db.generationBatchItem.update({
          where: { id: item.id },
          data: {
            status: 'COMPLETE',
            articleId: existingArticle.id,
            completedAt: new Date(),
          },
        });

        // Update batch progress
        await db.generationBatch.update({
          where: { id: batchId },
          data: {
            completedCount: { increment: 1 },
          },
        });

        continue;
      }

      // Update item status to GENERATING
      await db.generationBatchItem.update({
        where: { id: item.id },
        data: {
          status: 'GENERATING',
          startedAt: new Date(),
        },
      });

      // Generate the article
      const { generateArticle } = await import('@/lib/ai/generate-article');
      
      const article = await generateArticle({
        tenantId: batch.tenantId,
        topicId: batch.topicId,
        cityId: item.cityId,
        customInstructions: batch.instructions || undefined,
        preview: false,
      });

      // Update item as complete
      await db.generationBatchItem.update({
        where: { id: item.id },
        data: {
          status: 'COMPLETE',
          articleId: article.id,
          completedAt: new Date(),
        },
      });

      // Update batch progress
      await db.generationBatch.update({
        where: { id: batchId },
        data: {
          completedCount: { increment: 1 },
        },
      });
    } catch (error: any) {
      console.error(`Error generating article for item ${item.id}:`, error);

      // Update item as failed
      await db.generationBatchItem.update({
        where: { id: item.id },
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

  // Update batch status to complete
  const finalBatch = await db.generationBatch.findUnique({
    where: { id: batchId },
  });

  if (finalBatch) {
    const status =
      finalBatch.failedCount === 0
        ? 'COMPLETE'
        : finalBatch.completedCount > 0
        ? 'PARTIAL_FAILURE'
        : 'COMPLETE';

    await db.generationBatch.update({
      where: { id: batchId },
      data: { status },
    });
  }
}
