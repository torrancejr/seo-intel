import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantCities = await db.tenantCity.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        city: true,
      },
      orderBy: {
        city: {
          name: 'asc',
        },
      },
    });

    const cities = tenantCities.map(tc => tc.city);

    return NextResponse.json({ cities });
  } catch (error) {
    console.error('Error fetching tenant cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
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

    const { cityId } = await request.json();

    if (!cityId) {
      return NextResponse.json(
        { error: 'City ID is required' },
        { status: 400 }
      );
    }

    // Check if already selected
    const existing = await db.tenantCity.findUnique({
      where: {
        tenantId_cityId: {
          tenantId: session.user.tenantId,
          cityId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'City already selected' },
        { status: 400 }
      );
    }

    const tenantCity = await db.tenantCity.create({
      data: {
        tenantId: session.user.tenantId,
        cityId,
      },
      include: {
        city: true,
      },
    });

    return NextResponse.json({ tenantCity }, { status: 201 });
  } catch (error) {
    console.error('Error adding city:', error);
    return NextResponse.json(
      { error: 'Failed to add city' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get('cityId');

    if (!cityId) {
      return NextResponse.json(
        { error: 'City ID is required' },
        { status: 400 }
      );
    }

    await db.tenantCity.delete({
      where: {
        tenantId_cityId: {
          tenantId: session.user.tenantId,
          cityId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing city:', error);
    return NextResponse.json(
      { error: 'Failed to remove city' },
      { status: 500 }
    );
  }
}
