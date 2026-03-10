import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { enrichCity, enrichMultipleCities, enrichAllTenantCities } from '@/lib/data-enrichment/enrichment-orchestrator';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { cityIds, enrichAll } = body;

    let results;

    if (enrichAll) {
      // Enrich all cities for this tenant
      results = await enrichAllTenantCities(session.user.tenantId);
    } else if (cityIds && Array.isArray(cityIds)) {
      // Enrich specific cities
      results = await enrichMultipleCities(cityIds);
    } else {
      return NextResponse.json(
        { error: 'Either cityIds array or enrichAll flag required' },
        { status: 400 }
      );
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
      },
    });
  } catch (error: any) {
    console.error('Error in city enrichment API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enrich city data' },
      { status: 500 }
    );
  }
}
