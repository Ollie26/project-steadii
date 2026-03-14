'use client';

import React, { useEffect, useState, useCallback } from 'react';
import MealCard from '@/components/meals/MealCard';
import MealFilters from '@/components/meals/MealFilters';

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

interface Filters {
  mealType: string;
  tirColor: string;
  dateRange: string;
  search: string;
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function groupMealsByDate(meals: Meal[]): Record<string, Meal[]> {
  const groups: Record<string, Meal[]> = {};
  meals.forEach((meal) => {
    const dateKey = new Date(meal.timestamp).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(meal);
  });
  return groups;
}

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [filters, setFilters] = useState<Filters>({
    mealType: '',
    tirColor: '',
    dateRange: 'today',
    search: '',
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchMeals = useCallback(
    async (pageNum: number, append = false) => {
      try {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        const params = new URLSearchParams();
        params.set('page', String(pageNum));
        params.set('limit', '20');
        if (filters.mealType) params.set('mealType', filters.mealType);
        if (filters.tirColor) params.set('tirColor', filters.tirColor);
        if (filters.dateRange) params.set('dateRange', filters.dateRange);
        if (filters.search) params.set('search', filters.search);

        const res = await fetch(`/api/meals?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const newMeals: Meal[] = data.meals || data || [];
          setMeals((prev) => (append ? [...prev, ...newMeals] : newMeals));
          setHasMore(newMeals.length >= 20);
        }
      } catch (err) {
        console.error('Failed to fetch meals:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    setPage(1);
    fetchMeals(1, false);
  }, [fetchMeals]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMeals(nextPage, true);
  };

  const grouped = groupMealsByDate(meals);
  const dateKeys = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Meals</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Track how food affects your glucose
        </p>
      </div>

      {/* Filters */}
      <div className="px-4 py-4 bg-white border-b border-gray-100">
        <MealFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 animate-pulse space-y-3"
              >
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-3 w-32 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : meals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-[#6B7280]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A2E] mb-1">
              No meals yet
            </h3>
            <p className="text-sm text-[#6B7280] max-w-xs">
              Log your first meal to start tracking how food affects your blood
              sugar.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {dateKeys.map((dateKey) => (
              <div key={dateKey}>
                <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3 px-1">
                  {getDateLabel(dateKey)}
                </h2>
                <div className="space-y-3">
                  {grouped[dateKey]
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .map((meal) => (
                      <MealCard key={meal.id} meal={meal} />
                    ))}
                </div>
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
