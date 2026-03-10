import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the API key belongs to the user's tenant
    const apiKey = await db.apiKey.findUnique({
      where: { id: params.id },
      select: { tenantId: true },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    if (apiKey.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the API key
    await db.apiKey.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete API key' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isActive } = await request.json();

    // Verify the API key belongs to the user's tenant
    const apiKey = await db.apiKey.findUnique({
      where: { id: params.id },
      select: { tenantId: true },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    if (apiKey.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the API key
    const updatedKey = await db.apiKey.update({
      where: { id: params.id },
      data: { isActive },
    });

    return NextResponse.json({ apiKey: updatedKey });
  } catch (error: any) {
    console.error('Error updating API key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update API key' },
      { status: 500 }
    );
  }
}
