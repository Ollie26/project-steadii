"use client";

import { useState, useEffect } from "react";
import type { MealItem } from "./MealItemCard";

interface FavoriteMeal {
  id: string;
  name: string;
  totalCarbs: number;
  items: MealItem[];
}

interface FavoriteMealsProps {
  onAddItems: (items: MealItem[]) => void;
}

export default function FavoriteMeals({ onAddItems }: FavoriteMealsProps) {
  const [meals, setMeals] = useState<FavoriteMeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/meals/favorites")
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
        Loading favorites...
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
              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-700">
            No Favorites Yet
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Star a meal when logging to save it here for quick re-logging.
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
              <p className="text-sm font-semibold text-gray-800 truncate">
                {meal.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {meal.items.length} item{meal.items.length !== 1 ? "s" : ""}
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
