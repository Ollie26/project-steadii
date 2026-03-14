"use client";

import Link from "next/link";

interface MiniCurvePoint {
  timestamp: string;
  value: number;
}

interface Meal {
  id: string;
  name: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  carbsGrams: number;
  tirColor: "green" | "amber" | "red";
  timestamp: string;
  miniCurve?: MiniCurvePoint[];
}

interface RecentMealsProps {
  meals: Meal[];
}

const mealTypeIcons: Record<string, string> = {
  breakfast: "\uD83C\uDF05",
  lunch: "\uD83C\uDF1E",
  dinner: "\uD83C\uDF19",
  snack: "\uD83C\uDF7F",
};

const mealTypeLabels: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const tirDotColors: Record<string, string> = {
  green: "bg-[#4ECDC4]",
  amber: "bg-[#F4A261]",
  red: "bg-[#E76F6F]",
};

function formatMealTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return time;
  if (isYesterday) return `Yesterday ${time}`;
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`;
}

export default function RecentMeals({ meals }: RecentMealsProps) {
  if (meals.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-medium text-[#1A1A2E]">
          Recent Meals
        </h3>
        <div className="py-6 text-center">
          <p className="text-lg text-[#6B7280]">No meals logged yet</p>
          <Link
            href="/log"
            className="mt-2 inline-block text-sm font-medium text-[#8B7EC8] hover:text-[#7A6DB7]"
          >
            Log your first meal &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#1A1A2E]">Recent Meals</h3>
        <Link
          href="/meals"
          className="text-xs font-medium text-[#8B7EC8] hover:text-[#7A6DB7]"
        >
          See all
        </Link>
      </div>

      <div className="space-y-2">
        {meals.slice(0, 5).map((meal) => (
          <Link
            key={meal.id}
            href={`/meals/${meal.id}`}
            className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-gray-50"
          >
            {/* Meal type icon */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50 text-lg">
              {mealTypeIcons[meal.mealType] || "\uD83C\uDF7D\uFE0F"}
            </div>

            {/* Meal info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-[#1A1A2E]">
                  {meal.name}
                </span>
                <span
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${tirDotColors[meal.tirColor] || "bg-gray-300"}`}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <span>{mealTypeLabels[meal.mealType]}</span>
                <span className="text-gray-300">&middot;</span>
                <span>{meal.carbsGrams}g carbs</span>
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex-shrink-0 text-xs text-[#6B7280]">
              {formatMealTime(meal.timestamp)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
