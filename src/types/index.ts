// ============================================================
// Shared TypeScript types for Steadii
// ============================================================

// --- Enums & literal types ---

export type GlucoseUnit = "mgdl" | "mmol";
export type WeightUnit = "lbs" | "kg";
export type HeightUnit = "inches" | "cm";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export type GlucoseTrend =
  | "doubleUp"
  | "singleUp"
  | "fortyFiveUp"
  | "flat"
  | "fortyFiveDown"
  | "singleDown"
  | "doubleDown"
  | "notComputable"
  | "rateOutOfRange";

export type BGClassification =
  | "minimal"
  | "mild"
  | "moderate"
  | "significant"
  | "severe";

export type BGRangeLabel =
  | "in-range"
  | "high"
  | "low"
  | "severe-high"
  | "severe-low";

export type PainPointSlug =
  | "post-meal-spikes"
  | "overnight-lows"
  | "dawn-phenomenon"
  | "exercise-drops"
  | "stress-spikes"
  | "inconsistent-meals"
  | "carb-counting"
  | "insulin-timing"
  | "alcohol-effects"
  | "travel-disruption";

// --- Core data interfaces ---

export interface BGImpact {
  preMealBG: number;
  peakBG: number;
  peakDelta: number;
  peakTimeMinutes: number;
  threeHourBG: number;
  threeHourDelta: number;
  nadirBG: number;
  returnToBaselineMinutes: number | null;
  areaUnderCurve: number;
  tirPercent: number;
  classification: BGClassification;
}

export interface FoodAnalysis {
  name: string;
  servingSize: string;
  calories: number;
  carbsG: number;
  fiberG: number;
  netCarbsG: number;
  proteinG: number;
  fatG: number;
  sugarG: number;
  glycemicIndex: number | null;
  glycemicLoad: number | null;
  confidence: number;
  warnings: string[];
}

export interface InsightData {
  title: string;
  summary: string;
  details: string;
  category: "pattern" | "recommendation" | "achievement" | "warning";
  severity: "info" | "success" | "warning" | "critical";
  relatedMealIds?: string[];
  metrics?: Record<string, number | string>;
}

export interface MealItem {
  id: string;
  mealId: string;
  name: string;
  servingSize: string | null;
  calories: number | null;
  carbsG: number | null;
  fiberG: number | null;
  netCarbsG: number | null;
  proteinG: number | null;
  fatG: number | null;
  sugarG: number | null;
  glycemicIndex: number | null;
  glycemicLoad: number | null;
}

export interface Meal {
  id: string;
  userId: string;
  type: MealType;
  description: string | null;
  notes: string | null;
  imageUrl: string | null;
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MealWithItems extends Meal {
  items: MealItem[];
}

export interface LifestyleData {
  sleep: {
    hoursSlept: number | null;
    quality: "poor" | "fair" | "good" | "excellent" | null;
    bedtime: string | null;
    wakeTime: string | null;
  };
  exercise: {
    type: string | null;
    durationMinutes: number | null;
    intensity: "low" | "moderate" | "high" | null;
    timeOfDay: TimeOfDay | null;
  };
  stress: {
    level: 1 | 2 | 3 | 4 | 5 | null;
    notes: string | null;
  };
  hydration: {
    glasses: number | null;
  };
  medication: {
    taken: boolean;
    notes: string | null;
  };
}

export interface DexcomEGV {
  recordId: string;
  systemTime: string;
  displayTime: string;
  value: number;
  unit: "mg/dL";
  rateOfChange: number | null;
  trend: GlucoseTrend;
  trendRate: number | null;
  transmitterId: string;
  transmitterGeneration: string;
  displayDevice: string;
}

export interface CommonFood {
  id: string;
  name: string;
  servingSize: string;
  calories: number;
  carbsG: number;
  fiberG: number;
  netCarbsG: number;
  proteinG: number;
  fatG: number;
  sugarG: number;
  glycemicIndex: number | null;
  glycemicLoad: number | null;
  category: string;
}

// --- Utility / API types ---

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
