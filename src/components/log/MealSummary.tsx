"use client";

import { useEffect, useState } from "react";
import type { MealItem } from "./MealItemCard";

interface MealSummaryProps {
  items: MealItem[];
  mealType: string;
  notes: string;
  glycemicEstimate: "low" | "medium" | "high" | null;
}

interface PredictionData {
  avgPeak: number;
  mealCount: number;
}

export default function MealSummary({
  items,
}: MealSummaryProps) {
  const [prediction, setPrediction] = useState<PredictionData | null>(null);

  const totals = items.reduce(
    (acc, item) => {
      const m = item.servingMultiplier;
      return {
        carbs: acc.carbs + Math.round(item.carbs * m),
        protein: acc.protein + Math.round(item.protein * m),
        fat: acc.fat + Math.round(item.fat * m),
        calories: acc.calories + Math.round(item.calories * m),
      };
    },
    { carbs: 0, protein: 0, fat: 0, calories: 0 }
  );

  useEffect(() => {
    if (items.length === 0) {
      setPrediction(null);
      return;
    }

    const foodNames = items.map((i) => i.name).join(",");
    const controller = new AbortController();

    fetch(`/api/meals?similarTo=${encodeURIComponent(foodNames)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.avgPeak) {
          setPrediction({
            avgPeak: data.avgPeak,
            mealCount: data.mealCount || 0,
          });
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        Add foods to see nutrition totals
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Totals bar */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="bg-[#8B7EC8]/10 rounded-xl py-3 px-2">
          <p className="text-xl font-bold text-[#8B7EC8]">{totals.carbs}g</p>
          <p className="text-[11px] text-[#8B7EC8]/70 font-medium mt-0.5">
            Carbs
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl py-3 px-2">
          <p className="text-lg font-semibold text-gray-700">
            {totals.protein}g
          </p>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">
            Protein
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl py-3 px-2">
          <p className="text-lg font-semibold text-gray-700">{totals.fat}g</p>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">Fat</p>
        </div>
        <div className="bg-gray-50 rounded-xl py-3 px-2">
          <p className="text-lg font-semibold text-gray-700">
            {totals.calories}
          </p>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">Cal</p>
        </div>
      </div>

      {/* Items list */}
      <div className="flex flex-col gap-1">
        {items.map((item) => {
          const m = item.servingMultiplier;
          return (
            <div
              key={item.id}
              className="flex justify-between items-center py-1.5 text-sm"
            >
              <span className="text-gray-600 truncate flex-1 min-w-0 pr-2">
                {item.name}
                {m !== 1 && (
                  <span className="text-gray-400 text-xs"> x{m}</span>
                )}
              </span>
              <span className="text-gray-500 shrink-0 text-xs">
                {Math.round(item.carbs * m)}g C &middot;{" "}
                {Math.round(item.protein * m)}g P &middot;{" "}
                {Math.round(item.fat * m)}g F
              </span>
            </div>
          );
        })}
      </div>

      {/* Prediction panel */}
      {prediction && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-blue-700">
            Based on {prediction.mealCount} similar meal
            {prediction.mealCount !== 1 ? "s" : ""}
          </p>
          <p className="text-sm text-blue-800 mt-1">
            Avg peak:{" "}
            <span className="font-bold">+{prediction.avgPeak} mg/dL</span>
          </p>
        </div>
      )}
    </div>
  );
}
