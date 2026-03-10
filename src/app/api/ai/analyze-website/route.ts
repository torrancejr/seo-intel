import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { analyzeWebsite } from '@/lib/ai/analyze-website';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { websiteUrl } = body;

    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    // Analyze the website
    const analysis = await analyzeWebsite(websiteUrl);

    // Save the business context to the tenant
    await db.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        businessContext: analysis as any,
        businessDescription: `${analysis.businessType} specializing in ${analysis.keyServices.join(', ')}. Target audience: ${analysis.targetAudience}.`,
      },
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Error analyzing website:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze website' },
      { status: 500 }
    );
  }
}
