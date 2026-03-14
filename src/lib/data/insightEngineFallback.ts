// ============================================================
// Rule-based fallback insight engine
// Used when AI_ENABLED=false or when AI call fails
// ============================================================

import { average, stddev, roundTo } from "./stats";

// --- Types ---

export interface FallbackInsight {
  category: string;
  title: string;
  body: string;
  actionable: string | null;
  dataPoints: number;
  confidence: "low" | "medium" | "high";
  source: "fallback";
  relatedPainPoint: string | null;
}

export interface FallbackMealData {
  id: string;
  timestamp: Date;
  mealType: string;
  name: string | null;
  carbsGrams: number | null;
  proteinGrams: number | null;
  fatGrams: number | null;
  fiberGrams: number | null;
  tirScore: number | null;
  tirColor: string | null;
  bgImpactJson: string | null;
  items: Array<{ name: string; carbsGrams: number | null }>;
}

export interface FallbackReadingData {
  timestamp: Date;
  value: number;
}

export interface FallbackLifestyleData {
  timestamp: Date;
  type: string;
  intensity: number | null;
  dataJson: string | null;
}

export interface FallbackPainPointData {
  slug: string;
  label: string;
}

export interface FallbackProfileData {
  targetLow: number;
  targetHigh: number;
}

export interface FallbackInsightInput {
  meals: FallbackMealData[];
  readings: FallbackReadingData[];
  lifestyleLogs: FallbackLifestyleData[];
  painPoints: FallbackPainPointData[];
  profile: FallbackProfileData;
}

// --- Main function ---

/**
 * Generate insights using deterministic rules.
 * Implements all 7 fallback categories from the spec.
 */
export function generateInsightsFallback(
  input: FallbackInsightInput
): FallbackInsight[] {
  const { meals, readings, lifestyleLogs, painPoints, profile } = input;
  const insights: FallbackInsight[] = [];
  const painPointSlugs = new Set(painPoints.map((pp) => pp.slug));

  // 1. Food Rankings
  const foodRankings = generateFoodRankings(meals);
  insights.push(...foodRankings);

  // 2. Time-of-Day Patterns
  const todPatterns = generateTimeOfDayPatterns(meals);
  insights.push(...todPatterns);

  // 3. Stress Correlation
  if (painPointSlugs.has("stress-spikes") || lifestyleLogs.some((l) => l.type === "stress")) {
    const stressInsights = generateStressCorrelation(
      readings,
      lifestyleLogs
    );
    insights.push(...stressInsights);
  }

  // 4. Post-meal Spike Patterns
  if (painPointSlugs.has("post-meal-spikes") || meals.length >= 5) {
    const spikeInsights = generateSpikePatterns(meals);
    insights.push(...spikeInsights);
  }

  // 5. Exercise Effect
  const exerciseInsights = generateExerciseEffect(
    readings,
    lifestyleLogs,
    profile
  );
  insights.push(...exerciseInsights);

  // 6. Overnight Patterns
  if (
    painPointSlugs.has("overnight-lows") ||
    painPointSlugs.has("dawn-phenomenon")
  ) {
    const overnightInsights = generateOvernightPatterns(readings, profile);
    insights.push(...overnightInsights);
  }

  // 7. General Stats Trends
  const generalInsights = generateGeneralTrends(readings, meals, profile);
  insights.push(...generalInsights);

  return insights;
}

// --- Category 1: Food Rankings ---

function generateFoodRankings(meals: FallbackMealData[]): FallbackInsight[] {
  const insights: FallbackInsight[] = [];
  const mealsWithTIR = meals.filter((m) => m.tirScore != null);

  // Group by primary food item (normalize names)
  const foodGroups = new Map<
    string,
    { tirScores: number[]; peakDeltas: number[]; count: number }
  >();

  for (const meal of mealsWithTIR) {
    const foodName = normalizeFoodName(
      meal.items[0]?.name || meal.name || "Unknown"
    );
    if (!foodGroups.has(foodName)) {
      foodGroups.set(foodName, { tirScores: [], peakDeltas: [], count: 0 });
    }
    const group = foodGroups.get(foodName)!;
    group.tirScores.push(meal.tirScore!);
    group.count++;

    if (meal.bgImpactJson) {
      try {
        const impact = JSON.parse(meal.bgImpactJson);
        if (typeof impact.peakDelta === "number") {
          group.peakDeltas.push(impact.peakDelta);
        }
      } catch {
        // Skip invalid JSON
      }
    }
  }

  // Filter to foods with 3+ instances
  const qualifiedFoods = Array.from(foodGroups.entries())
    .filter(([, data]) => data.count >= 3)
    .map(([name, data]) => ({
      name,
      avgTIR: roundTo(average(data.tirScores)),
      avgPeakDelta: data.peakDeltas.length > 0 ? roundTo(average(data.peakDeltas)) : null,
      count: data.count,
    }))
    .sort((a, b) => b.avgTIR - a.avgTIR);

  if (qualifiedFoods.length >= 2) {
    // Best foods
    const bestFoods = qualifiedFoods.slice(0, Math.min(5, qualifiedFoods.length));
    const bestList = bestFoods
      .map(
        (f) =>
          `${f.name} -- avg ${f.avgPeakDelta != null ? `peak of +${f.avgPeakDelta} mg/dL, ` : ""}${f.avgTIR}% in range across ${f.count} meals`
      )
      .join("; ");

    insights.push({
      category: "food",
      title: "Your best foods for blood sugar",
      body: `These foods consistently keep you in range: ${bestList}.`,
      actionable: `Consider having more of these foods, especially ${bestFoods[0].name}.`,
      dataPoints: bestFoods.reduce((sum, f) => sum + f.count, 0),
      confidence: confidenceFromPoints(
        bestFoods.reduce((sum, f) => sum + f.count, 0)
      ),
      source: "fallback",
      relatedPainPoint: null,
    });

    // Worst foods
    const worstFoods = qualifiedFoods.slice(-Math.min(5, qualifiedFoods.length)).reverse();
    if (worstFoods.length > 0 && worstFoods[0].avgTIR < 60) {
      const worstList = worstFoods
        .map(
          (f) =>
            `${f.name} -- avg ${f.avgPeakDelta != null ? `peak of +${f.avgPeakDelta} mg/dL, ` : ""}${f.avgTIR}% in range across ${f.count} meals`
        )
        .join("; ");

      insights.push({
        category: "food",
        title: "Foods to watch",
        body: `These foods tend to push you out of range: ${worstList}.`,
        actionable: `Try smaller portions of ${worstFoods[0].name}, or pair it with protein and fiber to slow absorption.`,
        dataPoints: worstFoods.reduce((sum, f) => sum + f.count, 0),
        confidence: confidenceFromPoints(
          worstFoods.reduce((sum, f) => sum + f.count, 0)
        ),
        source: "fallback",
        relatedPainPoint: "post-meal-spikes",
      });
    }
  }

  return insights;
}

// --- Category 2: Time-of-Day Patterns ---

function generateTimeOfDayPatterns(
  meals: FallbackMealData[]
): FallbackInsight[] {
  const insights: FallbackInsight[] = [];
  const mealsWithTIR = meals.filter((m) => m.tirScore != null);

  if (mealsWithTIR.length < 10) return insights;

  const byType = new Map<string, number[]>();
  for (const meal of mealsWithTIR) {
    const type = meal.mealType;
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(meal.tirScore!);
  }

  const typeStats = Array.from(byType.entries())
    .filter(([, scores]) => scores.length >= 3)
    .map(([type, scores]) => ({
      type,
      avgTIR: roundTo(average(scores)),
      count: scores.length,
    }))
    .sort((a, b) => b.avgTIR - a.avgTIR);

  if (typeStats.length >= 2) {
    const best = typeStats[0];
    const worst = typeStats[typeStats.length - 1];
    const diff = roundTo(best.avgTIR - worst.avgTIR);

    if (diff > 15) {
      insights.push({
        category: "time_of_day",
        title: `${capitalize(worst.type)} is your toughest meal`,
        body: `Your ${worst.type} meals average ${worst.avgTIR}% in range vs. ${best.avgTIR}% at ${best.type}. That's a ${diff} percentage point difference across ${worst.count} ${worst.type} and ${best.count} ${best.type} meals.`,
        actionable: `Consider adjusting your ${worst.type} insulin timing or food choices. What works at ${best.type} might give you clues.`,
        dataPoints: best.count + worst.count,
        confidence: confidenceFromPoints(best.count + worst.count),
        source: "fallback",
        relatedPainPoint: null,
      });
    }
  }

  return insights;
}

// --- Category 3: Stress Correlation ---

function generateStressCorrelation(
  readings: FallbackReadingData[],
  lifestyleLogs: FallbackLifestyleData[]
): FallbackInsight[] {
  const insights: FallbackInsight[] = [];
  const stressLogs = lifestyleLogs.filter((l) => l.type === "stress" && l.intensity != null);

  if (stressLogs.length < 5) return insights;

  const highStressLogs = stressLogs.filter((l) => (l.intensity ?? 0) >= 4);
  const lowStressLogs = stressLogs.filter((l) => (l.intensity ?? 0) <= 2);

  if (highStressLogs.length < 2 || lowStressLogs.length < 2) return insights;

  // Get average BG during high-stress vs low-stress windows (2 hours after log)
  const highStressBG = getReadingsNearTimestamps(
    readings,
    highStressLogs.map((l) => l.timestamp),
    2 * 60 * 60 * 1000
  );
  const lowStressBG = getReadingsNearTimestamps(
    readings,
    lowStressLogs.map((l) => l.timestamp),
    2 * 60 * 60 * 1000
  );

  if (highStressBG.length < 5 || lowStressBG.length < 5) return insights;

  const avgHighStress = roundTo(average(highStressBG));
  const avgLowStress = roundTo(average(lowStressBG));
  const diff = roundTo(avgHighStress - avgLowStress);

  if (diff > 20) {
    insights.push({
      category: "stress",
      title: "Stress raises your blood sugar",
      body: `When you're highly stressed, your average BG runs ${Math.round(diff)} mg/dL higher (${Math.round(avgHighStress)} vs ${Math.round(avgLowStress)} mg/dL). This is based on ${highStressLogs.length} high-stress and ${lowStressLogs.length} low-stress periods.`,
      actionable:
        "On high-stress days, you might need to be more active or check more frequently. Even a 10-minute walk can help bring stress-related highs down.",
      dataPoints: highStressLogs.length + lowStressLogs.length,
      confidence: confidenceFromPoints(
        highStressLogs.length + lowStressLogs.length
      ),
      source: "fallback",
      relatedPainPoint: "stress-spikes",
    });
  }

  return insights;
}

// --- Category 4: Post-meal Spike Patterns ---

function generateSpikePatterns(meals: FallbackMealData[]): FallbackInsight[] {
  const insights: FallbackInsight[] = [];

  const mealsWithImpact = meals.filter((m) => m.bgImpactJson != null);
  if (mealsWithImpact.length < 5) return insights;

  const parsedMeals = mealsWithImpact
    .map((m) => {
      try {
        const impact = JSON.parse(m.bgImpactJson!);
        return { ...m, peakDelta: impact.peakDelta as number };
      } catch {
        return null;
      }
    })
    .filter((m): m is FallbackMealData & { peakDelta: number } => m != null);

  // Find meals with significant spikes (>60 mg/dL)
  const spikeMeals = parsedMeals.filter((m) => m.peakDelta > 60);

  if (spikeMeals.length < 3) return insights;

  // Check for high-carb pattern
  const spikeCarbs = spikeMeals
    .filter((m) => m.carbsGrams != null)
    .map((m) => m.carbsGrams!);
  const nonSpikeCarbs = parsedMeals
    .filter((m) => m.peakDelta <= 60 && m.carbsGrams != null)
    .map((m) => m.carbsGrams!);

  if (spikeCarbs.length >= 3 && nonSpikeCarbs.length >= 3) {
    const avgSpikeCarbs = roundTo(average(spikeCarbs));
    const avgNonSpikeCarbs = roundTo(average(nonSpikeCarbs));

    if (avgSpikeCarbs > avgNonSpikeCarbs * 1.3) {
      insights.push({
        category: "food",
        title: "Higher carb meals cause bigger spikes",
        body: `Your biggest spikes (>60 mg/dL) come from meals averaging ${Math.round(avgSpikeCarbs)}g carbs, while your well-managed meals average ${Math.round(avgNonSpikeCarbs)}g carbs. Your spikes are ${Math.round(((avgSpikeCarbs - avgNonSpikeCarbs) / avgNonSpikeCarbs) * 100)}% higher in carbs.`,
        actionable: `Try keeping meals under ${Math.round(avgNonSpikeCarbs + 10)}g carbs, or add protein and fiber to higher-carb meals to slow absorption.`,
        dataPoints: spikeMeals.length + parsedMeals.length,
        confidence: confidenceFromPoints(parsedMeals.length),
        source: "fallback",
        relatedPainPoint: "post-meal-spikes",
      });
    }
  }

  // Check for fiber correlation
  const spikeFiber = spikeMeals
    .filter((m) => m.fiberGrams != null)
    .map((m) => m.fiberGrams!);
  const nonSpikeFiber = parsedMeals
    .filter((m) => m.peakDelta <= 60 && m.fiberGrams != null)
    .map((m) => m.fiberGrams!);

  if (spikeFiber.length >= 3 && nonSpikeFiber.length >= 3) {
    const avgSpikeFiber = roundTo(average(spikeFiber));
    const avgNonSpikeFiber = roundTo(average(nonSpikeFiber));

    if (avgNonSpikeFiber > avgSpikeFiber * 1.5 && avgNonSpikeFiber > 3) {
      insights.push({
        category: "food",
        title: "Fiber helps control your spikes",
        body: `Meals where you stay in range have ${roundTo(avgNonSpikeFiber)}g of fiber on average, compared to ${roundTo(avgSpikeFiber)}g in your spike meals. Fiber slows carb absorption.`,
        actionable: `Add fiber-rich foods (vegetables, beans, whole grains) to meals that tend to spike you.`,
        dataPoints: spikeFiber.length + nonSpikeFiber.length,
        confidence: confidenceFromPoints(
          spikeFiber.length + nonSpikeFiber.length
        ),
        source: "fallback",
        relatedPainPoint: "post-meal-spikes",
      });
    }
  }

  return insights;
}

// --- Category 5: Exercise Effect ---

function generateExerciseEffect(
  readings: FallbackReadingData[],
  lifestyleLogs: FallbackLifestyleData[],
  profile: FallbackProfileData
): FallbackInsight[] {
  const insights: FallbackInsight[] = [];
  const exerciseLogs = lifestyleLogs.filter((l) => l.type === "exercise");

  if (exerciseLogs.length < 5) return insights;

  // Get exercise days vs non-exercise days
  const exerciseDays = new Set(
    exerciseLogs.map((l) => l.timestamp.toISOString().split("T")[0])
  );

  const readingsByDay = new Map<string, number[]>();
  for (const r of readings) {
    const day = r.timestamp.toISOString().split("T")[0];
    if (!readingsByDay.has(day)) readingsByDay.set(day, []);
    readingsByDay.get(day)!.push(r.value);
  }

  const exerciseDayAvgs: number[] = [];
  const nonExerciseDayAvgs: number[] = [];

  for (const [day, values] of Array.from(readingsByDay.entries())) {
    if (values.length < 10) continue; // Skip days with insufficient data
    const dayAvg = average(values);
    if (exerciseDays.has(day)) {
      exerciseDayAvgs.push(dayAvg);
    } else {
      nonExerciseDayAvgs.push(dayAvg);
    }
  }

  if (exerciseDayAvgs.length < 3 || nonExerciseDayAvgs.length < 3)
    return insights;

  const avgExercise = roundTo(average(exerciseDayAvgs));
  const avgNoExercise = roundTo(average(nonExerciseDayAvgs));
  const diff = roundTo(avgNoExercise - avgExercise);

  // Calculate TIR for exercise vs non-exercise days
  const exerciseDayReadings = readings.filter((r) =>
    exerciseDays.has(r.timestamp.toISOString().split("T")[0])
  );
  const nonExerciseDayReadings = readings.filter(
    (r) => !exerciseDays.has(r.timestamp.toISOString().split("T")[0])
  );

  const exerciseTIR =
    exerciseDayReadings.length > 0
      ? roundTo(
          (exerciseDayReadings.filter(
            (r) =>
              r.value >= profile.targetLow && r.value <= profile.targetHigh
          ).length /
            exerciseDayReadings.length) *
            100
        )
      : 0;

  const noExerciseTIR =
    nonExerciseDayReadings.length > 0
      ? roundTo(
          (nonExerciseDayReadings.filter(
            (r) =>
              r.value >= profile.targetLow && r.value <= profile.targetHigh
          ).length /
            nonExerciseDayReadings.length) *
            100
        )
      : 0;

  if (diff > 5) {
    insights.push({
      category: "exercise",
      title: "Exercise helps your blood sugar",
      body: `On days you exercise, your average BG is ${Math.round(diff)} mg/dL lower (${Math.round(avgExercise)} vs ${Math.round(avgNoExercise)} mg/dL) and your TIR is ${roundTo(exerciseTIR - noExerciseTIR)}% higher. This is based on ${exerciseDayAvgs.length} exercise days and ${nonExerciseDayAvgs.length} non-exercise days.`,
      actionable:
        "Keep it up! Even light exercise like a 15-minute walk after meals can make a significant difference.",
      dataPoints: exerciseDayAvgs.length + nonExerciseDayAvgs.length,
      confidence: confidenceFromPoints(
        exerciseDayAvgs.length + nonExerciseDayAvgs.length
      ),
      source: "fallback",
      relatedPainPoint: "exercise-drops",
    });
  }

  return insights;
}

// --- Category 6: Overnight Patterns ---

function generateOvernightPatterns(
  readings: FallbackReadingData[],
  profile: FallbackProfileData
): FallbackInsight[] {
  const insights: FallbackInsight[] = [];

  // Filter for overnight readings (10pm - 7am)
  const overnightReadings = readings.filter((r) => {
    const hour = r.timestamp.getHours();
    return hour >= 22 || hour < 7;
  });

  if (overnightReadings.length < 20) return insights;

  // Count overnight lows
  const overnightLows = overnightReadings.filter(
    (r) => r.value < profile.targetLow
  );

  // Find time distribution of lows
  if (overnightLows.length >= 3) {
    const lowHours = overnightLows.map((r) => r.timestamp.getHours());
    const avgLowHour = Math.round(
      average(lowHours.map((h) => (h < 7 ? h + 24 : h))) % 24
    );
    const formattedHour = formatHour(avgLowHour);

    const daySpan = Math.max(
      1,
      Math.ceil(
        (Math.max(...readings.map((r) => r.timestamp.getTime())) -
          Math.min(...readings.map((r) => r.timestamp.getTime()))) /
          (24 * 60 * 60 * 1000)
      )
    );
    const weekCount = Math.max(1, Math.round(daySpan / 7));

    insights.push({
      category: "sleep",
      title: "Overnight lows detected",
      body: `You've gone below ${profile.targetLow} mg/dL during the night ${overnightLows.length} times in the past ${weekCount} week${weekCount > 1 ? "s" : ""}. Most happened around ${formattedHour}. Average low value: ${Math.round(average(overnightLows.map((r) => r.value)))} mg/dL.`,
      actionable:
        "Consider a bedtime snack with protein and fat, or talk to your doctor about adjusting your basal insulin.",
      dataPoints: overnightLows.length,
      confidence: confidenceFromPoints(overnightLows.length),
      source: "fallback",
      relatedPainPoint: "overnight-lows",
    });
  }

  // Check for dawn phenomenon (rising BG between 4am-7am)
  const earlyMorningReadings = readings.filter((r) => {
    const hour = r.timestamp.getHours();
    return hour >= 4 && hour < 7;
  });

  const lateNightReadings = readings.filter((r) => {
    const hour = r.timestamp.getHours();
    return hour >= 1 && hour < 4;
  });

  if (earlyMorningReadings.length >= 10 && lateNightReadings.length >= 10) {
    const avgEarlyMorning = average(earlyMorningReadings.map((r) => r.value));
    const avgLateNight = average(lateNightReadings.map((r) => r.value));
    const rise = roundTo(avgEarlyMorning - avgLateNight);

    if (rise > 20) {
      insights.push({
        category: "sleep",
        title: "Dawn phenomenon detected",
        body: `Your blood sugar tends to rise by about ${Math.round(rise)} mg/dL between 1-4am (avg ${Math.round(avgLateNight)} mg/dL) and 4-7am (avg ${Math.round(avgEarlyMorning)} mg/dL). This pattern of early morning rises is common.`,
        actionable:
          "Talk to your doctor about adjusting morning basal rates or timing of long-acting insulin. A bedtime protein snack may also help.",
        dataPoints: earlyMorningReadings.length + lateNightReadings.length,
        confidence: confidenceFromPoints(
          earlyMorningReadings.length + lateNightReadings.length
        ),
        source: "fallback",
        relatedPainPoint: "dawn-phenomenon",
      });
    }
  }

  return insights;
}

// --- Category 7: General Stats Trends ---

function generateGeneralTrends(
  readings: FallbackReadingData[],
  meals: FallbackMealData[],
  profile: FallbackProfileData
): FallbackInsight[] {
  const insights: FallbackInsight[] = [];

  if (readings.length < 20) return insights;

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeekReadings = readings.filter((r) => r.timestamp >= oneWeekAgo);
  const lastWeekReadings = readings.filter(
    (r) => r.timestamp >= twoWeeksAgo && r.timestamp < oneWeekAgo
  );

  if (thisWeekReadings.length >= 10 && lastWeekReadings.length >= 10) {
    const thisWeekTIR = roundTo(
      (thisWeekReadings.filter(
        (r) => r.value >= profile.targetLow && r.value <= profile.targetHigh
      ).length /
        thisWeekReadings.length) *
        100
    );
    const lastWeekTIR = roundTo(
      (lastWeekReadings.filter(
        (r) => r.value >= profile.targetLow && r.value <= profile.targetHigh
      ).length /
        lastWeekReadings.length) *
        100
    );

    const tirChange = roundTo(thisWeekTIR - lastWeekTIR);

    if (tirChange > 5) {
      // TIR improved
      insights.push({
        category: "general",
        title: "Your Time in Range improved!",
        body: `Your Time in Range improved from ${lastWeekTIR}% to ${thisWeekTIR}% this week -- that's a ${tirChange} percentage point improvement. Keep up the great work!`,
        actionable: null,
        dataPoints: thisWeekReadings.length + lastWeekReadings.length,
        confidence: confidenceFromPoints(
          thisWeekReadings.length + lastWeekReadings.length
        ),
        source: "fallback",
        relatedPainPoint: null,
      });
    } else if (tirChange < -5) {
      // TIR declined
      insights.push({
        category: "warning",
        title: "Time in Range dipped this week",
        body: `Your Time in Range went from ${lastWeekTIR}% last week to ${thisWeekTIR}% this week. That's a ${Math.abs(tirChange)} percentage point drop. Stress, schedule changes, or different food choices could be factors.`,
        actionable:
          "Review what changed this week. Check your meal log for patterns -- did you eat more high-GI foods or skip exercise?",
        dataPoints: thisWeekReadings.length + lastWeekReadings.length,
        confidence: confidenceFromPoints(
          thisWeekReadings.length + lastWeekReadings.length
        ),
        source: "fallback",
        relatedPainPoint: null,
      });
    }

    // Count lows comparison
    const thisWeekLows = thisWeekReadings.filter(
      (r) => r.value < profile.targetLow
    ).length;
    const lastWeekLows = lastWeekReadings.filter(
      (r) => r.value < profile.targetLow
    ).length;

    if (thisWeekLows > lastWeekLows + 3 && thisWeekLows >= 5) {
      insights.push({
        category: "warning",
        title: "More lows this week",
        body: `You've had ${thisWeekLows} low readings this week, up from ${lastWeekLows} last week. More frequent lows can be a sign that insulin doses need adjusting.`,
        actionable:
          "Track when lows happen -- is it after meals, overnight, or during exercise? This helps identify the cause.",
        dataPoints: thisWeekLows + lastWeekLows,
        confidence: "medium",
        source: "fallback",
        relatedPainPoint: "overnight-lows",
      });
    }
  }

  // Variability insight
  const bgValues = readings.map((r) => r.value);
  const sd = stddev(bgValues);
  const avg = average(bgValues);
  const cv = avg > 0 ? roundTo((sd / avg) * 100) : 0;

  if (cv > 36) {
    insights.push({
      category: "general",
      title: "High blood sugar variability",
      body: `Your glucose coefficient of variation is ${cv}%, which indicates significant variability (above the 36% target). Your standard deviation is ${Math.round(sd)} mg/dL with an average of ${Math.round(avg)} mg/dL.`,
      actionable:
        "High variability often comes from rapid carb swings. Try more consistent meal sizes and timing, and consider pre-bolusing for fast-acting carbs.",
      dataPoints: readings.length,
      confidence: confidenceFromPoints(readings.length),
      source: "fallback",
      relatedPainPoint: null,
    });
  }

  return insights;
}

// --- Helpers ---

/**
 * Get BG readings that fall within a time window after the given timestamps.
 */
function getReadingsNearTimestamps(
  readings: FallbackReadingData[],
  timestamps: Date[],
  windowMs: number
): number[] {
  const values: number[] = [];

  for (const ts of timestamps) {
    const tStart = ts.getTime();
    const tEnd = tStart + windowMs;

    for (const r of readings) {
      const t = r.timestamp.getTime();
      if (t >= tStart && t <= tEnd) {
        values.push(r.value);
      }
    }
  }

  return values;
}

/**
 * Normalize food names for grouping.
 * "brown rice" and "rice, brown" should match.
 */
function normalizeFoodName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[,]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .sort()
    .join(" ");
}

/**
 * Determine confidence level from number of data points.
 */
function confidenceFromPoints(points: number): "low" | "medium" | "high" {
  if (points < 5) return "low";
  if (points <= 15) return "medium";
  return "high";
}

/**
 * Capitalize the first letter of a string.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format an hour (0-23) as a readable time string.
 */
function formatHour(hour: number): string {
  const h = hour % 24;
  if (h === 0) return "12:00 AM";
  if (h === 12) return "12:00 PM";
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
}
