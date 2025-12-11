// lib/db.ts
import { sql } from '@vercel/postgres';
import { Food, Nutrient, SummaryStats, SensitivityData, TopFood } from './types';

// Initialize database tables
export async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS foods (
        fdc_id INTEGER PRIMARY KEY,
        description TEXT NOT NULL,
        data_type TEXT,
        publication_date DATE,
        brand_owner TEXT,
        query_term TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS nutrients (
        id SERIAL PRIMARY KEY,
        fdc_id INTEGER REFERENCES foods(fdc_id) ON DELETE CASCADE,
        nutrient_id INTEGER,
        nutrient_name TEXT NOT NULL,
        nutrient_number TEXT,
        unit_name TEXT,
        value NUMERIC(10, 3),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_foods_description ON foods(description)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_foods_query_term ON foods(query_term)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_foods_data_type ON foods(data_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_nutrients_fdc_id ON nutrients(fdc_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_nutrients_name ON nutrients(nutrient_name)`;

    console.log('Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Search foods with optional filters
export async function searchFoods (query: string, limit = 50, offset = 0) {
  try {
    const result = await sql`
      SELECT 
        f.*,
        json_agg(
          json_build_object(
            'nutrient_name', n.nutrient_name,
            'value', n.value,
            'unit_name', n.unit_name
          )
        ) FILTER (WHERE n.id IS NOT NULL) as nutrients
      FROM foods f
      LEFT JOIN nutrients n ON f.fdc_id = n.fdc_id
      WHERE f.description ILIKE ${`%${query}%`} 
        OR f.query_term ILIKE ${`%${query}%`}
      GROUP BY f.fdc_id
      ORDER BY f.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return result.rows as Food[];
  } catch (error) {
    console.error('Error searching foods:', error);
    throw error;
  }
}

// Insert or update a food item
export async function upsertFood(food: Food) {
  try {
    await sql`
      INSERT INTO foods (
        fdc_id, description, data_type, publication_date, 
        brand_owner, query_term
      )
      VALUES (
        ${food.fdc_id}, 
        ${food.description}, 
        ${food.data_type || null}, 
        ${food.publication_date || null},
        ${food.brand_owner || null}, 
        ${food.query_term || null}
      )
      ON CONFLICT (fdc_id) 
      DO UPDATE SET
        description = EXCLUDED.description,
        data_type = EXCLUDED.data_type,
        publication_date = EXCLUDED.publication_date,
        brand_owner = EXCLUDED.brand_owner,
        query_term = EXCLUDED.query_term,
        updated_at = CURRENT_TIMESTAMP
    `;
    return { success: true };
  } catch (error) {
    console.error('Error upserting food:', error);
    throw error;
  }
}

// Insert a nutrient (skip if already exists)
export async function insertNutrient(nutrient: Nutrient) {
  try {
    await sql`
      INSERT INTO nutrients (
        fdc_id, nutrient_id, nutrient_name, 
        nutrient_number, unit_name, value
      )
      VALUES (
        ${nutrient.fdc_id}, 
        ${nutrient.nutrient_id}, 
        ${nutrient.nutrient_name},
        ${nutrient.nutrient_number || null}, 
        ${nutrient.unit_name}, 
        ${nutrient.value}
      )
      ON CONFLICT DO NOTHING
    `;
    return { success: true };
  } catch (error) {
    console.error('Error inserting nutrient:', error);
    throw error;
  }
}

// Get foods with nutrients
export async function getFoods(query?: string, limit = 50, offset = 0) {
  try {
    let result;
    
    if (query) {
      result = await sql`
        SELECT 
          f.*,
          json_agg(
            json_build_object(
              'nutrient_name', n.nutrient_name,
              'value', n.value,
              'unit_name', n.unit_name
            )
          ) FILTER (WHERE n.id IS NOT NULL) as nutrients
        FROM foods f
        LEFT JOIN nutrients n ON f.fdc_id = n.fdc_id
        WHERE f.description ILIKE ${`%${query}%`} 
          OR f.query_term ILIKE ${`%${query}%`}
        GROUP BY f.fdc_id
        ORDER BY f.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      result = await sql`
        SELECT 
          f.*,
          json_agg(
            json_build_object(
              'nutrient_name', n.nutrient_name,
              'value', n.value,
              'unit_name', n.unit_name
            )
          ) FILTER (WHERE n.id IS NOT NULL) as nutrients
        FROM foods f
        LEFT JOIN nutrients n ON f.fdc_id = n.fdc_id
        GROUP BY f.fdc_id
        ORDER BY f.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    return result.rows as Food[];
  } catch (error) {
    console.error('Error getting foods:', error);
    throw error;
  }
}

// Get summary statistics
export async function getSummaryStats(
  nutrient?: string,
  minValue?: number,
  maxValue?: number
): Promise<SummaryStats[]> {
  try {
    const result = await sql`
      SELECT 
        n.nutrient_name,
        n.unit_name,
        COUNT(*)::int as food_count,
        AVG(n.value)::numeric(10,2) as avg_value,
        MIN(n.value)::numeric(10,2) as min_value,
        MAX(n.value)::numeric(10,2) as max_value,
        STDDEV(n.value)::numeric(10,2) as std_dev,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY n.value)::numeric(10,2) as median_value
      FROM nutrients n
      WHERE n.value IS NOT NULL
      GROUP BY n.nutrient_name, n.unit_name
      ORDER BY food_count DESC
      LIMIT 20
    `;

    return result.rows as SummaryStats[];
  } catch (error) {
    console.error('Error getting summary stats:', error);
    throw error;
  }
}

// Sensitivity analysis
export async function getSensitivityData(
  nutrients: string[],
  foodQuery?: string
): Promise<SensitivityData[]> {
  try {
    // Build array of LIKE patterns for nutrients
    const nutrientPatterns = nutrients.map(n => `%${n}%`);
    
    let result;
    if (foodQuery) {
      // With food query filter
      const conditions = nutrients.map((_, i) => `n.nutrient_name ILIKE $${i + 1}`).join(' OR ');
      result = await sql.query(
        `SELECT 
          f.description,
          f.brand_owner,
          f.data_type,
          n.nutrient_name,
          n.value::numeric(10,2) as value,
          n.unit_name
        FROM foods f
        JOIN nutrients n ON f.fdc_id = n.fdc_id
        WHERE (${conditions})
        AND f.description ILIKE $${nutrients.length + 1}
        ORDER BY f.description, n.nutrient_name
        LIMIT 100`,
        [...nutrientPatterns, `%${foodQuery}%`]
      );
    } else {
      // Without food query filter
      const conditions = nutrients.map((_, i) => `n.nutrient_name ILIKE $${i + 1}`).join(' OR ');
      result = await sql.query(
        `SELECT 
          f.description,
          f.brand_owner,
          f.data_type,
          n.nutrient_name,
          n.value::numeric(10,2) as value,
          n.unit_name
        FROM foods f
        JOIN nutrients n ON f.fdc_id = n.fdc_id
        WHERE (${conditions})
        ORDER BY f.description, n.nutrient_name
        LIMIT 100`,
        nutrientPatterns
      );
    }

    return result.rows as SensitivityData[];
  } catch (error) {
    console.error('Error getting sensitivity data:', error);
    throw error;
  }
}

// Get top foods by nutrient
export async function getTopFoods(
  nutrient: string,
  limit = 15,
  order: 'ASC' | 'DESC' = 'DESC'
): Promise<TopFood[]> {
  try {
    const orderDirection = order === 'ASC' ? 'ASC' : 'DESC';
    
    const result = await sql.query(
      `SELECT 
        f.fdc_id,
        f.description,
        f.brand_owner,
        f.data_type,
        n.nutrient_name,
        n.value::numeric(10,2) as value,
        n.unit_name
      FROM foods f
      JOIN nutrients n ON f.fdc_id = n.fdc_id
      WHERE n.nutrient_name ILIKE $1
        AND n.value IS NOT NULL
      ORDER BY n.value ${orderDirection}
      LIMIT $2`,
      [`%${nutrient}%`, limit]
    );

    return result.rows as TopFood[];
  } catch (error) {
    console.error('Error getting top foods:', error);
    throw error;
  }
}