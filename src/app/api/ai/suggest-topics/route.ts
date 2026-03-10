import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { suggestTopics } from '@/lib/ai/analyze-website';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant's business context
    const tenant = await db.tenant.findUnique({
      where: { id: session.user.tenantId },
    });

    if (!tenant?.businessContext) {
      return NextResponse.json(
        { error: 'No business context found. Please analyze your website first.' },
        { status: 400 }
      );
    }

    // Generate topic suggestions
    const topics = await suggestTopics(tenant.businessContext as any);

    return NextResponse.json({
      success: true,
      topics,
    });
  } catch (error: any) {
    console.error('Error suggesting topics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to suggest topics' },
      { status: 500 }
    );
  }
}
