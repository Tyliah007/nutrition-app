// app/api/analytics/top-foods/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTopFoods } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nutrient = searchParams.get('nutrient');
    const limit = parseInt(searchParams.get('limit') || '15');
    const order = (searchParams.get('order') || 'DESC').toUpperCase() as 'ASC' | 'DESC';

    if (!nutrient) {
      return NextResponse.json(
        { error: 'Nutrient parameter is required' },
        { status: 400 }
      );
    }

    const foods = await getTopFoods(nutrient, limit, order);

    return NextResponse.json({
      success: true,
      count: foods.length,
      data: foods,
    });
  } catch (error) {
    console.error('Error fetching top foods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top foods' },
      { status: 500 }
    );
  }
}
