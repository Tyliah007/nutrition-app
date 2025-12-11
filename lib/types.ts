// lib/types.ts

// Database types (what we store in PostgreSQL)
export interface Food {
  fdc_id: number;
  description: string;
  data_type?: string;
  publication_date?: string;
  brand_owner?: string;
  query_term?: string;
  created_at?: string;
  updated_at?: string;
  nutrients?: Nutrient[];
}

export interface Nutrient {
  id?: number;
  fdc_id?: number;
  nutrient_id?: number;
  nutrient_name: string;
  nutrient_number?: string;
  unit_name: string;
  value: number;
}

// USDA API response types (what the API returns)
export interface USDAFoodSearchResponse {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  foods: USDAFood[];
}

export interface USDAFood {
  fdcId: number;
  description: string;
  dataType?: string;
  publicationDate?: string;
  brandOwner?: string;
  foodNutrients?: USDANutrient[];
}

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber?: string;
  unitName: string;
  value: number;
}

// Analytics types (what our analysis functions return)
export interface SummaryStats {
  nutrient_name: string;
  unit_name: string;
  food_count: number;
  avg_value: number;
  min_value: number;
  max_value: number;
  std_dev: number;
  median_value: number;
}

export interface SensitivityData {
  description: string;
  brand_owner?: string;
  data_type?: string;
  nutrient_name: string;
  value: number;
  unit_name: string;
}

export interface TopFood {
  fdc_id: number;
  description: string;
  brand_owner?: string;
  data_type?: string;
  nutrient_name: string;
  value: number;
  unit_name: string;
}