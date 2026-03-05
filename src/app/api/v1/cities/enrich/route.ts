import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { enrichCityData, enrichCitiesByIds } from '@/lib/data-enrichment/enrichment-orchestrator';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cityIds } = await request.json();

    if (!cityIds || !Array.isArray(cityIds) || cityIds.length === 0) {
      return NextResponse.json(
        { error: 'cityIds array is required' },
        { status: 400 }
      );
    }

    // Start enrichment in background
    enrichCitiesByIds(cityIds).catch(error => {
      console.error('Background enrichment error:', error);
    });

    return NextResponse.json({
      message: `Started enrichment for ${cityIds.length} cities`,
      cityIds,
    });
  } catch (error: any) {
    console.error('Error starting enrichment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start enrichment' },
      { status: 500 }
    );
  }
}
