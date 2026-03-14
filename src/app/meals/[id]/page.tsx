'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MealDetail from '@/components/meals/MealDetail';

interface MealItem {
  name: string;
  carbsGrams?: number;
  proteinGrams?: number;
  fatGrams?: number;
  calories?: number;
}

interface BGReading {
  timestamp: string;
  value: number;
}

interface BGImpact {
  peakDelta: number;
  timeToPeakMinutes: number;
  tirPercent: number;
  classification: string;
  preMealBG: number;
  peakBG: number;
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
  bgImpact?: BGImpact;
  notes?: string;
}

export default function MealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [meal, setMeal] = useState<Meal | null>(null);
  const [bgReadings, setBgReadings] = useState<BGReading[]>([]);
  const [similarMeals, setSimilarMeals] = useState<Meal[]>([]);
  const [targetLow, setTargetLow] = useState(70);
  const [targetHigh, setTargetHigh] = useState(180);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(false);

        // Fetch meal data
        const mealRes = await fetch(`/api/meals/${id}`);
        if (!mealRes.ok) {
          setError(true);
          return;
        }
        const mealData = await mealRes.json();
        setMeal(mealData);

        // Fetch glucose readings around meal time (2 hours before, 4 hours after)
        const mealTime = new Date(mealData.timestamp).getTime();
        const start = new Date(mealTime - 2 * 60 * 60 * 1000).toISOString();
        const end = new Date(mealTime + 4 * 60 * 60 * 1000).toISOString();

        try {
          const bgRes = await fetch(
            `/api/glucose/readings?start=${start}&end=${end}`
          );
          if (bgRes.ok) {
            const bgData = await bgRes.json();
            setBgReadings(bgData.readings || bgData || []);
          }
        } catch {
          // BG readings are optional
        }

        // Fetch target range
        try {
          const profileRes = await fetch('/api/profile');
          if (profileRes.ok) {
            const profile = await profileRes.json();
            if (profile.targetLow) setTargetLow(profile.targetLow);
            if (profile.targetHigh) setTargetHigh(profile.targetHigh);
          }
        } catch {
          // Use defaults
        }

        // Fetch similar meals
        try {
          const similarRes = await fetch(`/api/meals/${id}/similar`);
          if (similarRes.ok) {
            const similarData = await similarRes.json();
            setSimilarMeals(similarData.meals || similarData || []);
          }
        } catch {
          // Similar meals are optional
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleEdit = () => {
    router.push(`/meals/${id}/edit`);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/meals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/meals');
      }
    } catch {
      console.error('Failed to delete meal');
    }
  };

  const handleToggleFavorite = async () => {
    if (!meal) return;
    try {
      const res = await fetch(`/api/meals/${id}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !meal.isFavorite }),
      });
      if (res.ok) {
        setMeal({ ...meal, isFavorite: !meal.isFavorite });
      }
    } catch {
      console.error('Failed to toggle favorite');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 rounded-xl animate-pulse"
              />
            ))}
          </div>
          <div className="h-72 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !meal) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-[#E76F6F]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[#1A1A2E] mb-1">
          Meal not found
        </h2>
        <p className="text-sm text-[#6B7280] mb-4">
          This meal may have been deleted or doesn&apos;t exist.
        </p>
        <button
          onClick={() => router.push('/meals')}
          className="px-4 py-2 bg-[#8B7EC8] text-white rounded-xl text-sm font-medium"
        >
          Back to Meals
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Back button */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <button
          onClick={() => router.push('/meals')}
          className="flex items-center gap-1 text-[#8B7EC8] text-sm font-medium"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Meals
        </button>
      </div>

      <div className="p-4">
        <MealDetail
          meal={meal}
          bgReadings={bgReadings}
          targetLow={targetLow}
          targetHigh={targetHigh}
          similarMeals={similarMeals}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleFavorite={handleToggleFavorite}
        />
      </div>
    </div>
  );
}
