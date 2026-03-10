import { db } from '@/lib/db';
import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const {
      name,
      email,
      password,
      businessName,
      websiteUrl,
      businessDescription,
      slug,
    } = await request.json();

    // Validate required fields
    if (!name || !email || !password || !businessName || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingTenant = await db.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Subdomain already taken' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create tenant and user in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: businessName,
          slug,
          websiteUrl: websiteUrl || null,
          businessDescription: businessDescription || null,
          planTier: 'FREE',
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          tenantId: tenant.id,
          role: 'ADMIN',
        },
      });

      // Create default topics
      const defaultTopics = [
        { name: 'Local Business', slug: 'local-business', isCustom: false },
        { name: 'Real Estate', slug: 'real-estate', isCustom: false },
        { name: 'Legal Services', slug: 'legal-services', isCustom: false },
        { name: 'Healthcare', slug: 'healthcare', isCustom: false },
        { name: 'Technology', slug: 'technology', isCustom: false },
      ];

      await tx.topic.createMany({
        data: defaultTopics.map((topic) => ({
          ...topic,
          tenantId: tenant.id,
        })),
      });

      return { tenant, user };
    });

    return NextResponse.json({
      success: true,
      tenant: {
        id: result.tenant.id,
        slug: result.tenant.slug,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 500 }
    );
  }
}
