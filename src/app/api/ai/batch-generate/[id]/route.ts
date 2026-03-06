import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const batch = await db.generationBatch.findUnique({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        batchItems: {
          include: {
            city: true,
            article: {
              select: {
                id: true,
                title: true,
                wordCount: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

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
          error: item.error,
          articleId: item.article?.id,
          city: item.city,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching batch status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch batch status' },
      { status: 500 }
    );
  }
}
