// app/api/foods/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFoods } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const foods = await getFoods(query, limit, offset);

    return NextResponse.json({
      success: true,
      count: foods.length,
      data: foods,
    });
  } catch (error) {
    console.error('Error fetching foods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch foods' },
      { status: 500 }
    );
  }
}