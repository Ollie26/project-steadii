'use client';

import React from 'react';
import Link from 'next/link';
import { LineChart, Line } from 'recharts';

interface MealItem {
  name: string;
  carbsGrams?: number;
  proteinGrams?: number;
  fatGrams?: number;
  calories?: number;
}

interface Meal {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: string;
  carbsGrams: number;
  proteinGrams?: number;
  fatGrams?: number;
  calories?: number;
  tirColor: 'green' | 'amber' | 'red';
  tirScore?: number;
  photoUrl?: string;
  isFavorite: boolean;
  items?: MealItem[];
  bgImpactJson?: string;
}

interface MealCardProps {
  meal: Meal;
}

const mealTypeIcons: Record<string, string> = {
  breakfast: '\u2600\uFE0F',
  lunch: '\uD83C\uDF1E',
  dinner: '\uD83C\uDF19',
  snack: '\uD83C\uDF4E',
};

const tirColorMap: Record<string, string> = {
  green: '#4ECDC4',
  amber: '#F4A261',
  red: '#E76F6F',
};

export default function MealCard({ meal }: MealCardProps) {
  const time = new Date(meal.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  let bgData: { time: number; value: number }[] = [];
  if (meal.bgImpactJson) {
    try {
      bgData = JSON.parse(meal.bgImpactJson);
    } catch {
      bgData = [];
    }
  }

  return (
    <Link href={`/meals/${meal.id}`}>
      <div className="relative flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
        {/* TIR color dot on left edge */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-r-full"
          style={{ backgroundColor: tirColorMap[meal.tirColor] }}
        />

        {/* Main content */}
        <div className="flex-1 ml-2 min-w-0">
          {/* Top row: meal type + time */}
          <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1">
            <span>{mealTypeIcons[meal.mealType] || ''}</span>
            <span className="capitalize">{meal.mealType}</span>
            <span className="text-gray-300">|</span>
            <span>{time}</span>
          </div>

          {/* Meal name */}
          <p className="text-sm font-medium text-[#1A1A2E] truncate">
            {meal.name}
          </p>

          {/* Macros */}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm font-bold text-[#1A1A2E]">
              {meal.carbsGrams}g carbs
            </span>
            {meal.proteinGrams !== undefined && (
              <span className="text-xs text-[#6B7280]">
                {meal.proteinGrams}g P
              </span>
            )}
            {meal.fatGrams !== undefined && (
              <span className="text-xs text-[#6B7280]">
                {meal.fatGrams}g F
              </span>
            )}
            {meal.calories !== undefined && (
              <span className="text-xs text-[#6B7280]">
                {meal.calories} cal
              </span>
            )}
          </div>
        </div>

        {/* Right side: sparkline, photo, star */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mini sparkline */}
          {bgData.length > 1 && (
            <div className="opacity-60">
              <LineChart width={80} height={30} data={bgData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={tirColorMap[meal.tirColor]}
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </div>
          )}

          {/* Photo thumbnail */}
          {meal.photoUrl && (
            <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={meal.photoUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Star icon */}
          {meal.isFavorite && (
            <svg
              className="w-4 h-4 text-yellow-400 fill-current shrink-0"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
        </div>
      </div>
    </Link>
  );
}
