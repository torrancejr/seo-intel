import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import slugify from 'slugify';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const topics = await db.topic.findMany({
      where: { tenantId: session.user.tenantId },
      include: {
        _count: {
          select: { articles: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Topic name is required' },
        { status: 400 }
      );
    }

    const slug = slugify(name, { lower: true, strict: true });

    // Check if topic already exists
    const existing = await db.topic.findUnique({
      where: {
        tenantId_slug: {
          tenantId: session.user.tenantId,
          slug,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Topic already exists' },
        { status: 400 }
      );
    }

    const topic = await db.topic.create({
      data: {
        name: name.trim(),
        slug,
        tenantId: session.user.tenantId,
        isCustom: true,
      },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return NextResponse.json({ topic }, { status: 201 });
  } catch (error) {
    console.error('Error creating topic:', error);
    return NextResponse.json(
      { error: 'Failed to create topic' },
      { status: 500 }
    );
  }
}
