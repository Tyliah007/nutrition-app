// app/api/foods/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { upsertFood, insertNutrient } from '@/lib/db';
import { USDAFoodSearchResponse } from '@/lib/types';

const USDA_API_KEY = process.env.USDA_API_KEY || 'DEMO_KEY';
const USDA_BASE_URL = `https://api.nal.usda.gov/fdc/v1/${USDA_API_KEY}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, dataType, pageSize = 25, pageNumber = 1 } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Build USDA API URL
    const params = new URLSearchParams({
      api_key: USDA_API_KEY,
      query: query,
      pageSize: pageSize.toString(),
      pageNumber: pageNumber.toString(),
    });

    if (dataType && Array.isArray(dataType) && dataType.length > 0) {
      params.append('dataType', dataType.join(','));
    }

    // Fetch from USDA API
    const response = await fetch(`${USDA_BASE_URL}/foods/search?${params}`);
    
    if (!response.ok) {
      throw new Error(`USDA API error: ${response.statusText}`);
    }

    const data: USDAFoodSearchResponse = await response.json();
    const foods = data.foods || [];

    // Store in database
    for (const food of foods) {
      try {
        // Insert food
        await upsertFood({
          fdc_id: food.fdcId,
          description: food.description,
          data_type: food.dataType,
          publication_date: food.publicationDate,
          brand_owner: food.brandOwner,
          query_term: query,
        });

        // Insert nutrients
        if (food.foodNutrients && food.foodNutrients.length > 0) {
          for (const nutrient of food.foodNutrients) {
            await insertNutrient({
              fdc_id: food.fdcId,
              nutrient_id: nutrient.nutrientId,
              nutrient_name: nutrient.nutrientName,
              nutrient_number: nutrient.nutrientNumber,
              unit_name: nutrient.unitName,
              value: nutrient.value,
            });
          }
        }
      } catch (error) {
        console.error(`Error storing food ${food.fdcId}:`, error);
        // Continue with other foods even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      count: foods.length,
      totalHits: data.totalHits,
      data: foods,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search foods', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
      
    );
  }
}

// Fetch a food item by FDC ID
export async function getFoodByFdcId(fdc_id: number) {
  try {
    const result = await sql`
      SELECT * FROM foods WHERE fdc_id = ${fdc_id}
    `;
    // If `sql` returns a pg-style QueryResult with a `rows` array
    if (result && 'rows' in result) {
      return (result.rows[0] as any) || null;
    }
    // Fallback if `sql` returns an array-like result
    if (Array.isArray(result)) {
      return (result[0] as any) || null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching food by FDC ID:', error);
    return null;
  }
}