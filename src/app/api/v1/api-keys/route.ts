import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Generate a secure API key
function generateApiKey(): string {
  const prefix = 'sk_live_';
  const randomPart = randomBytes(32).toString('base64url');
  return `${prefix}${randomPart}`;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKeys = await db.apiKey.findMany({
      where: { tenantId: session.user.tenantId },
      select: {
        id: true,
        name: true,
        key: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mask the keys (show only last 4 characters)
    const maskedKeys = apiKeys.map((key) => ({
      ...key,
      key: `${key.key.substring(0, 10)}...${key.key.slice(-4)}`,
      keyPreview: key.key.slice(-4),
    }));

    return NextResponse.json({ apiKeys: maskedKeys });
  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch API keys' },
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

    const { name, expiresInDays } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      );
    }

    // Generate expiration date if specified
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Generate API key
    const key = generateApiKey();

    // Create API key
    const apiKey = await db.apiKey.create({
      data: {
        tenantId: session.user.tenantId,
        name,
        key,
        expiresAt,
        isActive: true,
      },
    });

    return NextResponse.json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key, // Return full key only on creation
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create API key' },
      { status: 500 }
    );
  }
}
