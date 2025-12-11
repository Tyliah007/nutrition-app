// app/api/analytics/sensitivity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSensitivityData } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nutrients, foodQuery } = body;

    if (!nutrients || !Array.isArray(nutrients) || nutrients.length === 0) {
      return NextResponse.json(
        { error: 'Nutrients array is required' },
        { status: 400 }
      );
    }

    const data = await getSensitivityData(nutrients, foodQuery);

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Error performing sensitivity analysis:', error);
    return NextResponse.json(
      { error: 'Failed to perform sensitivity analysis' },
      { status: 500 }
    );
  }
}
