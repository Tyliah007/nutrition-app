// app/api/analytics/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSummaryStats } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nutrient = searchParams.get('nutrient') || undefined;
    const minValue = searchParams.get('minValue') 
      ? parseFloat(searchParams.get('minValue')!) 
      : undefined;
    const maxValue = searchParams.get('maxValue') 
      ? parseFloat(searchParams.get('maxValue')!) 
      : undefined;

    const stats = await getSummaryStats(nutrient, minValue, maxValue);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summary statistics' },
      { status: 500 }
    );
  }
}