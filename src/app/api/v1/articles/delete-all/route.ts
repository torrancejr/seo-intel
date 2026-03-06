import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all articles for this tenant
    const result = await db.article.deleteMany({
      where: {
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({
      message: 'All articles deleted successfully',
      count: result.count,
    });
  } catch (error: any) {
    console.error('Error deleting articles:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete articles' },
      { status: 500 }
    );
  }
}
