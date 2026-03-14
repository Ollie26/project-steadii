// ============================================================
// Serialize user data into structured text for AI prompts
// ============================================================

import { average, stddev } from "./stats";

export interface ProfileData {
  name: string | null;
  age: number | null;
  diabetesType: string | null;
  diagnosisYear: number | null;
  lastA1C: number | null;
  targetLow: number;
  targetHigh: number;
  insulinType: string | null;
  rapidInsulinName: string | null;
  longActingName: string | null;
  carbRatio: number | null;
  correctionFactor: number | null;
}

export interface MealData {
  id: string;
  timestamp: Date;
  mealType: string;
  name: string | null;
  carbsGrams: number | null;
  proteinGrams: number | null;
  fatGrams: number | null;
  fiberGrams: number | null;
  calories: number | null;
  glycemicEstimate: string | null;
  tirScore: number | null;
  tirColor: string | null;
  bgImpactJson: string | null;
  items: Array<{
    name: string;
    carbsGrams: number | null;
    proteinGrams: number | null;
    fatGrams: number | null;
  }>;
}

export interface ReadingData {
  timestamp: Date;
  value: number;
}

export interface LifestyleLogData {
  timestamp: Date;
  type: string;
  intensity: number | null;
  dataJson: string | null;
  notes: string | null;
}

export interface PainPointData {
  slug: string;
  label: string;
  priority: number;
}

export interface PreviousInsightData {
  title: string;
  category: string;
  body: string;
}

export interface SerializeInput {
  profile: ProfileData;
  meals: MealData[];
  readings: ReadingData[];
  lifestyleLogs: LifestyleLogData[];
  painPoints: PainPointData[];
  previousInsights: PreviousInsightData[];
}

/**
 * Serialize all user data into a structured text payload for AI prompts.
 * This formats the data in a way that's easy for Claude to parse and analyze.
 */
export function serializeUserData(input: SerializeInput): string {
  const sections: string[] = [];

  // --- Profile Section ---
  sections.push(serializeProfile(input.profile));

  // --- Pain Points Section ---
  sections.push(serializePainPoints(input.painPoints));

  // --- Meals Section ---
  sections.push(serializeMeals(input.meals));

  // --- Lifestyle Logs Section ---
  sections.push(serializeLifestyleLogs(input.lifestyleLogs));

  // --- Summary Statistics Section ---
  sections.push(serializeSummaryStats(input.readings, input.meals, input.profile));

  // --- Previous Insights Section ---
  if (input.previousInsights.length > 0) {
    sections.push(serializePreviousInsights(input.previousInsights));
  }

  return sections.join("\n\n");
}

function serializeProfile(profile: ProfileData): string {
  const lines: string[] = ["=== USER PROFILE ==="];

  if (profile.name) lines.push(`Name: ${profile.name}`);
  if (profile.age) lines.push(`Age: ${profile.age}`);
  if (profile.diabetesType) lines.push(`Diabetes Type: ${profile.diabetesType}`);
  if (profile.diagnosisYear) lines.push(`Diagnosed: ${profile.diagnosisYear}`);
  if (profile.lastA1C) lines.push(`Last A1C: ${profile.lastA1C}%`);
  lines.push(`Target Range: ${profile.targetLow}-${profile.targetHigh} mg/dL`);
  if (profile.insulinType) lines.push(`Insulin Method: ${profile.insulinType}`);
  if (profile.rapidInsulinName)
    lines.push(`Rapid Insulin: ${profile.rapidInsulinName}`);
  if (profile.longActingName)
    lines.push(`Long-Acting: ${profile.longActingName}`);
  if (profile.carbRatio) lines.push(`Carb Ratio: 1:${profile.carbRatio}`);
  if (profile.correctionFactor)
    lines.push(`Correction Factor: 1 unit drops ${profile.correctionFactor} mg/dL`);

  return lines.join("\n");
}

function serializePainPoints(painPoints: PainPointData[]): string {
  if (painPoints.length === 0) return "=== PAIN POINTS ===\nNone specified";

  const sorted = [...painPoints].sort((a, b) => a.priority - b.priority);
  const lines = ["=== PAIN POINTS (ranked by priority) ==="];

  sorted.forEach((pp, i) => {
    lines.push(`${i + 1}. ${pp.label} (${pp.slug})`);
  });

  return lines.join("\n");
}

function serializeMeals(meals: MealData[]): string {
  if (meals.length === 0) return "=== MEALS ===\nNo meals logged yet";

  const lines = [`=== MEALS (last ${meals.length} meals) ===`];

  // Sort by timestamp descending (most recent first)
  const sorted = [...meals].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  for (const meal of sorted) {
    const date = meal.timestamp.toISOString().split("T")[0];
    const time = meal.timestamp.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let mealLine = `[${date} ${time}] ${meal.mealType.toUpperCase()}`;
    if (meal.name) mealLine += `: ${meal.name}`;

    const macros: string[] = [];
    if (meal.carbsGrams != null) macros.push(`${meal.carbsGrams}g carbs`);
    if (meal.proteinGrams != null) macros.push(`${meal.proteinGrams}g protein`);
    if (meal.fatGrams != null) macros.push(`${meal.fatGrams}g fat`);
    if (meal.fiberGrams != null) macros.push(`${meal.fiberGrams}g fiber`);
    if (meal.calories != null) macros.push(`${meal.calories} cal`);
    if (macros.length > 0) mealLine += ` | ${macros.join(", ")}`;

    if (meal.glycemicEstimate) mealLine += ` | GI: ${meal.glycemicEstimate}`;

    lines.push(mealLine);

    // Items
    if (meal.items.length > 0) {
      for (const item of meal.items) {
        lines.push(`  - ${item.name} (${item.carbsGrams ?? "?"}g carbs)`);
      }
    }

    // BG Impact
    if (meal.tirScore != null) {
      let impactLine = `  BG Impact: TIR ${meal.tirScore}% (${meal.tirColor ?? "?"})`;

      if (meal.bgImpactJson) {
        try {
          const impact = JSON.parse(meal.bgImpactJson);
          impactLine += `, peak +${impact.peakDelta} mg/dL at ${impact.peakTimeMinutes}min`;
          impactLine += `, classification: ${impact.classification}`;
        } catch {
          // JSON parse failed, skip
        }
      }

      lines.push(impactLine);
    }
  }

  return lines.join("\n");
}

function serializeLifestyleLogs(logs: LifestyleLogData[]): string {
  if (logs.length === 0)
    return "=== LIFESTYLE LOGS ===\nNo lifestyle data logged yet";

  const lines = [`=== LIFESTYLE LOGS (last ${logs.length} entries) ===`];

  const sorted = [...logs].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  for (const log of sorted) {
    const date = log.timestamp.toISOString().split("T")[0];
    const time = log.timestamp.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let logLine = `[${date} ${time}] ${log.type.toUpperCase()}`;
    if (log.intensity != null) logLine += ` intensity: ${log.intensity}/5`;

    if (log.dataJson) {
      try {
        const data = JSON.parse(log.dataJson);
        const details: string[] = [];
        for (const [key, value] of Object.entries(data)) {
          details.push(`${key}: ${value}`);
        }
        if (details.length > 0) logLine += ` | ${details.join(", ")}`;
      } catch {
        // JSON parse failed, skip
      }
    }

    if (log.notes) logLine += ` | "${log.notes}"`;

    lines.push(logLine);
  }

  return lines.join("\n");
}

function serializeSummaryStats(
  readings: ReadingData[],
  meals: MealData[],
  profile: ProfileData
): string {
  const lines = ["=== SUMMARY STATISTICS ==="];

  if (readings.length === 0) {
    lines.push("No glucose readings available");
    return lines.join("\n");
  }

  const values = readings.map((r) => r.value);
  const avgBG = average(values);
  const sdBG = stddev(values);
  const minBG = Math.min(...values);
  const maxBG = Math.max(...values);

  const inRange = values.filter(
    (v) => v >= profile.targetLow && v <= profile.targetHigh
  ).length;
  const tirPct = Math.round((inRange / values.length) * 100 * 10) / 10;

  const highs = values.filter((v) => v > profile.targetHigh).length;
  const lows = values.filter((v) => v < profile.targetLow).length;
  const estimatedA1C = Math.round(((avgBG + 46.7) / 28.7) * 10) / 10;

  lines.push(`Total BG readings: ${values.length}`);
  lines.push(`Average BG: ${Math.round(avgBG)} mg/dL`);
  lines.push(`Std Dev (variability): ${Math.round(sdBG)} mg/dL`);
  lines.push(`Min: ${minBG} mg/dL, Max: ${maxBG} mg/dL`);
  lines.push(`Time in Range (${profile.targetLow}-${profile.targetHigh}): ${tirPct}%`);
  lines.push(`Highs (>${profile.targetHigh}): ${highs} readings`);
  lines.push(`Lows (<${profile.targetLow}): ${lows} readings`);
  lines.push(`Estimated A1C: ${estimatedA1C}%`);
  lines.push(`Total meals logged: ${meals.length}`);

  // Weekly breakdown if enough data
  if (readings.length >= 2) {
    const firstDate = new Date(
      Math.min(...readings.map((r) => r.timestamp.getTime()))
    );
    const lastDate = new Date(
      Math.max(...readings.map((r) => r.timestamp.getTime()))
    );
    const daySpan = Math.ceil(
      (lastDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    lines.push(`Data span: ${daySpan} days (${firstDate.toISOString().split("T")[0]} to ${lastDate.toISOString().split("T")[0]})`);
  }

  // Meal TIR summary
  const mealsWithTIR = meals.filter((m) => m.tirScore != null);
  if (mealsWithTIR.length > 0) {
    const avgMealTIR =
      Math.round(
        (mealsWithTIR.reduce((sum, m) => sum + (m.tirScore ?? 0), 0) /
          mealsWithTIR.length) *
          10
      ) / 10;
    const greenMeals = mealsWithTIR.filter((m) => m.tirColor === "green").length;
    const amberMeals = mealsWithTIR.filter((m) => m.tirColor === "amber").length;
    const redMeals = mealsWithTIR.filter((m) => m.tirColor === "red").length;

    lines.push(`\nMeal BG Impact Summary:`);
    lines.push(`Meals with BG data: ${mealsWithTIR.length}`);
    lines.push(`Average post-meal TIR: ${avgMealTIR}%`);
    lines.push(
      `Green (good): ${greenMeals}, Amber (moderate): ${amberMeals}, Red (poor): ${redMeals}`
    );
  }

  return lines.join("\n");
}

function serializePreviousInsights(
  insights: PreviousInsightData[]
): string {
  const lines = [
    "=== PREVIOUS INSIGHTS (avoid repeating these) ===",
  ];

  for (const insight of insights) {
    lines.push(`- [${insight.category}] ${insight.title}: ${insight.body}`);
  }

  return lines.join("\n");
}
