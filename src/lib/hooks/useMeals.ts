'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MealItem {
  id: number;
  name: string;
  servingSize: string | null;
  carbsGrams: number | null;
  proteinGrams: number | null;
  fatGrams: number | null;
  fiberGrams: number | null;
  calories: number | null;
  source: string;
}

export interface Meal {
  id: number;
  timestamp: string;
  mealType: string;
  name: string | null;
  logMethod: string;
  carbsGrams: number | null;
  proteinGrams: number | null;
  fatGrams: number | null;
  fiberGrams: number | null;
  calories: number | null;
  bgImpactJson: string | null;
  tirScore: number | null;
  tirColor: string | null;
  isFavorite: boolean;
  items: MealItem[];
  createdAt: string;
}

export interface MealFilters {
  mealType?: string;
  startDate?: string;
  endDate?: string;
  favoritesOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateMealData {
  timestamp: string;
  mealType: string;
  name?: string;
  logMethod?: string;
  carbsGrams?: number;
  proteinGrams?: number;
  fatGrams?: number;
  fiberGrams?: number;
  calories?: number;
  items?: Omit<MealItem, 'id'>[];
}

export type UpdateMealData = Partial<CreateMealData>;

export interface MealActions {
  fetchMeals: (filters?: MealFilters) => Promise<void>;
  createMeal: (data: CreateMealData) => Promise<Meal>;
  updateMeal: (id: number, data: UpdateMealData) => Promise<Meal>;
  deleteMeal: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
}

interface UseMealsReturn {
  meals: Meal[];
  loading: boolean;
  error: string | null;
  actions: MealActions;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMeals(initialFilters?: MealFilters): UseMealsReturn {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  // ---- Fetch meals --------------------------------------------------------
  const fetchMeals = useCallback(async (filters?: MealFilters) => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.mealType) params.set('mealType', filters.mealType);
      if (filters?.startDate) params.set('startDate', filters.startDate);
      if (filters?.endDate) params.set('endDate', filters.endDate);
      if (filters?.favoritesOnly) params.set('favoritesOnly', 'true');
      if (filters?.limit) params.set('limit', String(filters.limit));
      if (filters?.offset) params.set('offset', String(filters.offset));

      const qs = params.toString();
      const url = `/api/meals${qs ? `?${qs}` : ''}`;
      const res = await fetch(url);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch meals (${res.status})`);
      }

      const data: Meal[] = await res.json();

      if (currentRequestId === requestIdRef.current) {
        setMeals(data);
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch meals',
        );
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // ---- Create meal --------------------------------------------------------
  const createMeal = useCallback(async (data: CreateMealData): Promise<Meal> => {
    setError(null);

    const res = await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.error || `Failed to create meal (${res.status})`;
      setError(msg);
      throw new Error(msg);
    }

    const created: Meal = await res.json();
    setMeals((prev) => [created, ...prev]);
    return created;
  }, []);

  // ---- Update meal --------------------------------------------------------
  const updateMeal = useCallback(
    async (id: number, data: UpdateMealData): Promise<Meal> => {
      setError(null);

      const res = await fetch(`/api/meals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body.error || `Failed to update meal (${res.status})`;
        setError(msg);
        throw new Error(msg);
      }

      const updated: Meal = await res.json();
      setMeals((prev) =>
        prev.map((m) => (m.id === id ? updated : m)),
      );
      return updated;
    },
    [],
  );

  // ---- Delete meal --------------------------------------------------------
  const deleteMeal = useCallback(async (id: number): Promise<void> => {
    setError(null);

    const res = await fetch(`/api/meals/${id}`, { method: 'DELETE' });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.error || `Failed to delete meal (${res.status})`;
      setError(msg);
      throw new Error(msg);
    }

    setMeals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // ---- Toggle favorite ----------------------------------------------------
  const toggleFavorite = useCallback(async (id: number): Promise<void> => {
    setError(null);

    // Optimistic update
    setMeals((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, isFavorite: !m.isFavorite } : m,
      ),
    );

    try {
      const res = await fetch(`/api/meals/${id}/favorite`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        // Revert optimistic update
        setMeals((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, isFavorite: !m.isFavorite } : m,
          ),
        );
        const body = await res.json().catch(() => ({}));
        const msg = body.error || `Failed to toggle favorite (${res.status})`;
        setError(msg);
        throw new Error(msg);
      }
    } catch (err) {
      // If the fetch itself threw (network error), also revert
      if (err instanceof TypeError) {
        setMeals((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, isFavorite: !m.isFavorite } : m,
          ),
        );
        setError('Network error toggling favorite');
      }
      throw err;
    }
  }, []);

  // ---- Initial fetch ------------------------------------------------------
  useEffect(() => {
    fetchMeals(initialFilters);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    meals,
    loading,
    error,
    actions: { fetchMeals, createMeal, updateMeal, deleteMeal, toggleFavorite },
  };
}
