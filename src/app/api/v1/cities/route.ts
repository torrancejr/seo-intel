import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all cities with tenant selection status
    const cities = await db.city.findMany({
      include: {
        tenantCities: {
          where: { tenantId: session.user.tenantId },
        },
        _count: {
          select: {
            articles: {
              where: { tenantId: session.user.tenantId },
            },
          },
        },
      },
      orderBy: [{ state: 'asc' }, { name: 'asc' }],
    });

    const citiesWithSelection = cities.map((city) => ({
      ...city,
      isSelected: city.tenantCities.length > 0,
      articleCount: city._count.articles,
      tenantCities: undefined,
      _count: undefined,
    }));

    return NextResponse.json({ cities: citiesWithSelection });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}
