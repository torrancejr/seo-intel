import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const batch = await db.generationBatch.findUnique({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        topic: {
          select: {
            name: true,
          },
        },
        batchItems: {
          include: {
            city: {
              select: {
                name: true,
                stateCode: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({ batch });
  } catch (error: any) {
    console.error('Error fetching batch:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch batch' },
      { status: 500 }
    );
  }
}
