"use client";

import { useState, useEffect } from "react";
import type { MealItem } from "./MealItemCard";

interface RecentMeal {
  id: string;
  name: string;
  totalCarbs: number;
  mealType: string;
  loggedAt: string;
  items: MealItem[];
}

interface RecentMealsListProps {
  onAddItems: (items: MealItem[]) => void;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return "Just now";
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

export default function RecentMealsList({ onAddItems }: RecentMealsListProps) {
  const [meals, setMeals] = useState<RecentMeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/meals/recent?limit=10")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setMeals(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-400 text-sm gap-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-[#8B7EC8] rounded-full animate-spin" />
        Loading recent meals...
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-7 h-7 text-gray-300"
          >
            <path
              fillRule="evenodd"
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-700">
            No Recent Meals
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Your recent meals will appear here for quick re-logging.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {meals.map((meal) => (
        <button
          key={meal.id}
          type="button"
          onClick={() => {
            const itemsWithNewIds = meal.items.map((item) => ({
              ...item,
              id: crypto.randomUUID(),
            }));
            onAddItems(itemsWithNewIds);
          }}
          className="w-full text-left bg-white border border-gray-100 rounded-xl shadow-sm px-4 py-3 hover:border-[#8B7EC8]/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {meal.name}
                </p>
                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
                  {meal.mealType}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {meal.items.length} item{meal.items.length !== 1 ? "s" : ""}{" "}
                &middot; {timeAgo(meal.loggedAt)}
              </p>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className="text-sm font-bold text-[#8B7EC8]">
                {meal.totalCarbs}g
              </p>
              <p className="text-[10px] text-gray-400">carbs</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
