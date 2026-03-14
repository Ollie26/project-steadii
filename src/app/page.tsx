"use client";

import { useEffect, useState, useCallback } from "react";
import CurrentBG from "@/components/dashboard/CurrentBG";
import GlucoseChart from "@/components/dashboard/GlucoseChart";
import QuickStats from "@/components/dashboard/QuickStats";
import RecentMeals from "@/components/dashboard/RecentMeals";
import ActiveInsight from "@/components/dashboard/ActiveInsight";
import LifestyleQuickLog from "@/components/dashboard/LifestyleQuickLog";
import DayNavigator from "@/components/dashboard/DayNavigator";

interface GlucoseReading {
  timestamp: string;
  value: number;
}

interface MealData {
  id: string;
  name: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  carbsGrams: number;
  tirColor: "green" | "amber" | "red";
  timestamp: string;
  miniCurve?: Array<{ timestamp: string; value: number }>;
}

interface MealMarker {
  timestamp: string;
  name: string;
  tirColor: string;
}

interface InsightData {
  title: string;
  body: string;
  category: string;
  confidence: string;
}

interface ProfileData {
  unit: string;
  targetLow: number;
  targetHigh: number;
}

interface StatsData {
  tir: number;
  average: number;
  estimatedA1C: number;
  stdDev: number;
  highCount: number;
  lowCount: number;
  period: string;
}

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
  );
}

function formatDateParam(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>({
    unit: "mg/dL",
    targetLow: 70,
    targetHigh: 180,
  });
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [meals, setMeals] = useState<MealData[]>([]);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [currentBG, setCurrentBG] = useState<{
    value: number | null;
    trend: string | null;
    lastUpdated: Date | null;
  }>({ value: null, trend: null, lastUpdated: null });

  const fetchDashboardData = useCallback(async (date: Date) => {
    setLoading(true);
    const dateParam = formatDateParam(date);

    try {
      const [profileRes, readingsRes, mealsRes, insightsRes, statsRes] =
        await Promise.allSettled([
          fetch("/api/profile"),
          fetch(`/api/glucose?date=${dateParam}`),
          fetch(`/api/meals?date=${dateParam}`),
          fetch("/api/insights?active=true"),
          fetch(`/api/stats?date=${dateParam}`),
        ]);

      // Profile
      if (profileRes.status === "fulfilled" && profileRes.value.ok) {
        const data = await profileRes.value.json();
        setProfile({
          unit: data.unit || "mg/dL",
          targetLow: data.targetLow ?? 70,
          targetHigh: data.targetHigh ?? 180,
        });
      }

      // Glucose readings
      if (readingsRes.status === "fulfilled" && readingsRes.value.ok) {
        const data = await readingsRes.value.json();
        const readingsList: GlucoseReading[] = data.readings || data || [];
        setReadings(readingsList);

        // Derive current BG from most recent reading
        if (readingsList.length > 0) {
          const sorted = [...readingsList].sort(
            (a, b) =>
              new Date(b.timestamp).getTime() -
              new Date(a.timestamp).getTime()
          );
          const latest = sorted[0];
          setCurrentBG({
            value: latest.value,
            trend: data.trend || null,
            lastUpdated: new Date(latest.timestamp),
          });
        } else {
          setCurrentBG({ value: null, trend: null, lastUpdated: null });
        }
      }

      // Meals
      if (mealsRes.status === "fulfilled" && mealsRes.value.ok) {
        const data = await mealsRes.value.json();
        setMeals(data.meals || data || []);
      }

      // Insights
      if (insightsRes.status === "fulfilled" && insightsRes.value.ok) {
        const data = await insightsRes.value.json();
        setInsights(data.insights || data || []);
      }

      // Stats
      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const data = await statsRes.value.json();
        setStats(data.stats || data || null);
      }
    } catch {
      // Network errors are silently handled; components show empty states
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(currentDate);
  }, [currentDate, fetchDashboardData]);

  // Poll for new glucose data every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(currentDate);
    }, 60000);
    return () => clearInterval(interval);
  }, [currentDate, fetchDashboardData]);

  const mealMarkers: MealMarker[] = meals.map((m) => ({
    timestamp: m.timestamp,
    name: m.name,
    tirColor: m.tirColor,
  }));

  const defaultStats: StatsData = {
    tir: 0,
    average: 0,
    estimatedA1C: 0,
    stdDev: 0,
    highCount: 0,
    lowCount: 0,
    period: "Today",
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
        {/* Day Navigator */}
        <div className="mb-6">
          <DayNavigator currentDate={currentDate} onChange={setCurrentDate} />
        </div>

        {loading ? (
          /* Loading skeleton */
          <div className="space-y-4">
            <SkeletonBlock className="h-[140px]" />
            <SkeletonBlock className="h-[310px]" />
            <div className="flex gap-2.5 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <SkeletonBlock key={i} className="h-[72px] min-w-[100px]" />
              ))}
            </div>
            <SkeletonBlock className="h-[200px]" />
            <SkeletonBlock className="h-[100px]" />
            <SkeletonBlock className="h-[120px]" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current BG Hero */}
            <CurrentBG
              value={currentBG.value}
              trend={currentBG.trend}
              lastUpdated={currentBG.lastUpdated}
              unit={profile.unit}
              targetLow={profile.targetLow}
              targetHigh={profile.targetHigh}
            />

            {/* Glucose Chart */}
            <GlucoseChart
              readings={readings}
              targetLow={profile.targetLow}
              targetHigh={profile.targetHigh}
              meals={mealMarkers}
              timeRange="6h"
            />

            {/* Quick Stats */}
            <QuickStats stats={stats || defaultStats} />

            {/* Recent Meals */}
            <RecentMeals meals={meals} />

            {/* Active Insight */}
            {insights.length > 0 && <ActiveInsight insights={insights} />}

            {/* Lifestyle Quick Log */}
            <LifestyleQuickLog />
          </div>
        )}
      </div>
    </div>
  );
}
