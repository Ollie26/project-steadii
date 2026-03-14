'use client';

import React, { useMemo } from 'react';

interface Meal {
  id: string;
  name: string;
  tirScore?: number;
  tirColor: 'green' | 'amber' | 'red';
  carbsGrams: number;
  bgImpact?: {
    peakDelta: number;
    tirPercent: number;
  };
}

interface FoodRankingProps {
  meals: Meal[];
}

interface FoodStats {
  name: string;
  avgTir: number;
  mealCount: number;
  avgPeakDelta: number;
}

export default function FoodRanking({ meals }: FoodRankingProps) {
  const { bestFoods, worstFoods } = useMemo(() => {
    // Group meals by name
    const foodMap = new Map<string, { tirs: number[]; peakDeltas: number[]; count: number }>();

    meals.forEach((meal) => {
      const name = meal.name.toLowerCase().trim();
      if (!foodMap.has(name)) {
        foodMap.set(name, { tirs: [], peakDeltas: [], count: 0 });
      }
      const entry = foodMap.get(name)!;
      entry.count++;
      if (meal.bgImpact?.tirPercent !== undefined) {
        entry.tirs.push(meal.bgImpact.tirPercent);
      } else if (meal.tirScore !== undefined) {
        entry.tirs.push(meal.tirScore);
      }
      if (meal.bgImpact?.peakDelta !== undefined) {
        entry.peakDeltas.push(meal.bgImpact.peakDelta);
      }
    });

    // Calculate averages and filter foods with enough data
    const stats: FoodStats[] = [];
    foodMap.forEach((data, name) => {
      if (data.count >= 2 && data.tirs.length > 0) {
        const avgTir =
          data.tirs.reduce((a, b) => a + b, 0) / data.tirs.length;
        const avgPeakDelta =
          data.peakDeltas.length > 0
            ? data.peakDeltas.reduce((a, b) => a + b, 0) / data.peakDeltas.length
            : 0;
        stats.push({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          avgTir: Math.round(avgTir),
          mealCount: data.count,
          avgPeakDelta: Math.round(avgPeakDelta),
        });
      }
    });

    // Sort by TIR
    stats.sort((a, b) => b.avgTir - a.avgTir);

    return {
      bestFoods: stats.slice(0, 5),
      worstFoods: stats.slice(-5).reverse(),
    };
  }, [meals]);

  if (bestFoods.length === 0 && worstFoods.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <p className="text-sm text-[#6B7280]">
          Need more meal data to rank foods. Log meals with similar names to see
          patterns.
        </p>
      </div>
    );
  }

  const FoodList = ({
    foods,
    type,
  }: {
    foods: FoodStats[];
    type: 'best' | 'worst';
  }) => (
    <div className="space-y-2">
      {foods.map((food, idx) => (
        <div
          key={food.name}
          className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3"
        >
          {/* Rank number */}
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              type === 'best'
                ? 'bg-[#4ECDC4]/10 text-[#4ECDC4]'
                : 'bg-[#E76F6F]/10 text-[#E76F6F]'
            }`}
          >
            {idx + 1}
          </span>

          {/* Food info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1A1A2E] truncate">
              {food.name}
            </p>
            <p className="text-xs text-[#6B7280]">
              {food.mealCount} meals logged
            </p>
          </div>

          {/* Stats */}
          <div className="text-right shrink-0">
            <p
              className={`text-sm font-bold ${
                type === 'best' ? 'text-[#4ECDC4]' : 'text-[#E76F6F]'
              }`}
            >
              {food.avgTir}% TIR
            </p>
            {food.avgPeakDelta > 0 && (
              <p className="text-xs text-[#6B7280]">
                +{food.avgPeakDelta} mg/dL peak
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Best foods */}
      {bestFoods.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#4ECDC4]" />
            <h4 className="text-sm font-semibold text-[#1A1A2E]">
              Best Foods for You
            </h4>
          </div>
          <FoodList foods={bestFoods} type="best" />
        </div>
      )}

      {/* Worst foods */}
      {worstFoods.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#E76F6F]" />
            <h4 className="text-sm font-semibold text-[#1A1A2E]">
              Foods to Watch
            </h4>
          </div>
          <FoodList foods={worstFoods} type="worst" />
        </div>
      )}
    </div>
  );
}
