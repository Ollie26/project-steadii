"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { MealItem } from "./MealItemCard";

interface FoodSearchProps {
  onAddItem: (item: MealItem) => void;
}

interface SearchResult {
  fdcId: number;
  description: string;
  brandOwner?: string;
  servingSize?: string;
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
}

interface FavoriteItem {
  id: string;
  name: string;
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
  servingSize: string;
}

const COMMON_FOODS = [
  { emoji: "🍌", name: "Banana", carbs: 27, protein: 1, fat: 0, calories: 105, serving: "1 medium" },
  { emoji: "🍎", name: "Apple", carbs: 25, protein: 0, fat: 0, calories: 95, serving: "1 medium" },
  { emoji: "🍞", name: "Bread (white)", carbs: 13, protein: 3, fat: 1, calories: 75, serving: "1 slice" },
  { emoji: "🍚", name: "White Rice", carbs: 45, protein: 4, fat: 0, calories: 206, serving: "1 cup cooked" },
  { emoji: "🥚", name: "Egg", carbs: 1, protein: 6, fat: 5, calories: 72, serving: "1 large" },
  { emoji: "🥛", name: "Milk (whole)", carbs: 12, protein: 8, fat: 8, calories: 150, serving: "1 cup" },
  { emoji: "🍗", name: "Chicken Breast", carbs: 0, protein: 31, fat: 4, calories: 165, serving: "100g" },
  { emoji: "🥑", name: "Avocado", carbs: 12, protein: 3, fat: 21, calories: 240, serving: "1 whole" },
  { emoji: "🍝", name: "Pasta", carbs: 43, protein: 8, fat: 1, calories: 220, serving: "1 cup cooked" },
  { emoji: "🥜", name: "Peanut Butter", carbs: 7, protein: 7, fat: 16, calories: 190, serving: "2 tbsp" },
  { emoji: "🧀", name: "Cheese (cheddar)", carbs: 0, protein: 7, fat: 9, calories: 113, serving: "1 oz" },
  { emoji: "🍊", name: "Orange", carbs: 15, protein: 1, fat: 0, calories: 62, serving: "1 medium" },
  { emoji: "🥔", name: "Potato", carbs: 37, protein: 4, fat: 0, calories: 163, serving: "1 medium" },
  { emoji: "🥣", name: "Oatmeal", carbs: 27, protein: 5, fat: 3, calories: 150, serving: "1 cup cooked" },
  { emoji: "🍓", name: "Strawberries", carbs: 12, protein: 1, fat: 0, calories: 49, serving: "1 cup" },
  { emoji: "🌮", name: "Tortilla (flour)", carbs: 24, protein: 4, fat: 4, calories: 146, serving: "1 medium" },
];

export default function FoodSearch({ onAddItem }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [recentItems, setRecentItems] = useState<FavoriteItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch favorites and recent on mount
  useEffect(() => {
    fetch("/api/meals/favorites")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setFavorites(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch("/api/meals/recent")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setRecentItems(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/food/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : data.results || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const addCommonFood = (food: (typeof COMMON_FOODS)[number]) => {
    onAddItem({
      id: crypto.randomUUID(),
      name: food.name,
      servingSize: food.serving,
      servingMultiplier: 1,
      carbs: food.carbs,
      protein: food.protein,
      fat: food.fat,
      calories: food.calories,
    });
  };

  const addSearchResult = (r: SearchResult) => {
    onAddItem({
      id: crypto.randomUUID(),
      name: r.description,
      servingSize: r.servingSize || "1 serving",
      servingMultiplier: 1,
      carbs: r.carbs,
      protein: r.protein,
      fat: r.fat,
      calories: r.calories,
      brand: r.brandOwner,
    });
    setQuery("");
    setResults([]);
  };

  const addFavoriteOrRecent = (item: FavoriteItem) => {
    onAddItem({
      id: crypto.randomUUID(),
      name: item.name,
      servingSize: item.servingSize,
      servingMultiplier: 1,
      carbs: item.carbs,
      protein: item.protein,
      fat: item.fat,
      calories: item.calories,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Search input */}
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Search foods..."
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/40 focus:border-[#8B7EC8] transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results */}
      {loading && (
        <div className="flex items-center justify-center py-6 text-gray-400 text-sm gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-[#8B7EC8] rounded-full animate-spin" />
          Searching...
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="flex flex-col divide-y divide-gray-100">
          {results.map((r, i) => (
            <button
              key={`${r.fdcId}-${i}`}
              type="button"
              onClick={() => addSearchResult(r)}
              className="flex items-center justify-between py-3 px-1 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="min-w-0 flex-1 pr-3">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {r.description}
                </p>
                {r.brandOwner && (
                  <p className="text-xs text-gray-400 truncate">
                    {r.brandOwner}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-[#8B7EC8]">
                  {r.carbs}g carbs
                </p>
                <p className="text-[10px] text-gray-400">
                  {r.servingSize || "per serving"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-4">
          No results found
        </p>
      )}

      {/* No query: show common, favorites, recent */}
      {!query && (
        <>
          {/* Common Foods */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Common Foods
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {COMMON_FOODS.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => addCommonFood(f)}
                  className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl bg-gray-50 hover:bg-[#8B7EC8]/10 transition-colors"
                >
                  <span className="text-xl">{f.emoji}</span>
                  <span className="text-[11px] text-gray-600 text-center leading-tight">
                    {f.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Favorites */}
          {favorites.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Your Favorites
              </h3>
              <div className="flex flex-col divide-y divide-gray-100">
                {favorites.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => addFavoriteOrRecent(f)}
                    className="flex items-center justify-between py-2.5 px-1 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="text-sm text-gray-700 truncate">
                      {f.name}
                    </span>
                    <span className="text-xs text-[#8B7EC8] font-medium shrink-0 ml-2">
                      {f.carbs}g carbs
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent */}
          {recentItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Recent
              </h3>
              <div className="flex flex-col divide-y divide-gray-100">
                {recentItems.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => addFavoriteOrRecent(f)}
                    className="flex items-center justify-between py-2.5 px-1 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="text-sm text-gray-700 truncate">
                      {f.name}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {f.carbs}g carbs
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !query && results.length === 0 && favorites.length === 0 && recentItems.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-2">
              Type to search thousands of foods
            </p>
          )}
        </>
      )}
    </div>
  );
}
