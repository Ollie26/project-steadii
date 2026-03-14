'use client';

import React, { useEffect, useState } from 'react';
import InsightCard from '@/components/insights/InsightCard';
import PainPointProgress from '@/components/insights/PainPointProgress';
import FoodRanking from '@/components/insights/FoodRanking';
import AskSteadii from '@/components/insights/AskSteadii';
import AIBanner from '@/components/insights/AIBanner';

interface Insight {
  id: string;
  title: string;
  body: string;
  actionable?: string;
  category: 'food' | 'time' | 'stress' | 'exercise' | 'sleep' | 'general' | 'warning';
  confidence: number;
  dataPoints?: number;
  source: 'AI' | 'Basic';
}

interface PainPoint {
  id: string;
  label: string;
  description?: string;
  active: boolean;
}

interface PainPointStat {
  painPointId: string;
  metric: string;
  currentValue: number;
  previousValue: number;
  unit: string;
  trend: 'improving' | 'worsening' | 'stable';
}

interface Meal {
  id: string;
  name: string;
  tirScore?: number;
  tirColor: 'green' | 'amber' | 'red';
  carbsGrams: number;
  bgImpact?: {
    peakDelta: number;
    tirPercent: number;
  };
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [painPointStats, setPainPointStats] = useState<PainPointStat[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [aiDisabled, setAiDisabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        // Fetch all data in parallel
        const [insightsRes, painPointsRes, mealsRes, profileRes] =
          await Promise.allSettled([
            fetch('/api/insights'),
            fetch('/api/profile/pain-points'),
            fetch('/api/meals?limit=100'),
            fetch('/api/profile'),
          ]);

        if (insightsRes.status === 'fulfilled' && insightsRes.value.ok) {
          const data = await insightsRes.value.json();
          setInsights(data.insights || data || []);
        }

        if (painPointsRes.status === 'fulfilled' && painPointsRes.value.ok) {
          const data = await painPointsRes.value.json();
          setPainPoints(data.painPoints || data || []);
          setPainPointStats(data.stats || []);
        }

        if (mealsRes.status === 'fulfilled' && mealsRes.value.ok) {
          const data = await mealsRes.value.json();
          setMeals(data.meals || data || []);
        }

        if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
          const data = await profileRes.value.json();
          if (data.aiEnabled === false) {
            setAiDisabled(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch insights data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/insights/generate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights || data || []);
      }
    } catch (err) {
      console.error('Failed to refresh insights:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                  <div className="h-3 w-full bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasNoData =
    insights.length === 0 &&
    painPoints.length === 0 &&
    meals.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A2E]">Insights</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Patterns and recommendations
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2 bg-[#8B7EC8]/10 text-[#8B7EC8] rounded-xl text-sm font-medium hover:bg-[#8B7EC8]/20 transition-colors disabled:opacity-50"
          >
            {refreshing ? (
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
            ) : (
              'Refresh'
            )}
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* AI Banner */}
        <AIBanner show={aiDisabled} />

        {hasNoData ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-[#8B7EC8]/10 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-[#8B7EC8]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 2a1 1 0 011 1v1.323l1.954.674a1 1 0 01.09 1.82L11 7.86V10a1 1 0 11-2 0V7.86L6.956 6.817a1 1 0 01.09-1.82L9 4.323V3a1 1 0 011-1zm-5 9a1 1 0 011 1v.586l.707-.293a1 1 0 01.828 1.818L6 14.818V16a1 1 0 11-2 0v-1.182l-1.535-.707a1 1 0 01.828-1.818L4 12.586V12a1 1 0 011-1zm10 0a1 1 0 011 1v.586l.707-.293a1 1 0 01.828 1.818L16 14.818V16a1 1 0 11-2 0v-1.182l-1.535-.707a1 1 0 01.828-1.818L14 12.586V12a1 1 0 011-1z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A2E] mb-1">
              No insights yet
            </h3>
            <p className="text-sm text-[#6B7280] max-w-xs">
              Log meals and glucose data to start receiving personalized
              insights and recommendations.
            </p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-5 py-2.5 bg-[#8B7EC8] text-white rounded-xl text-sm font-medium hover:bg-[#7A6DB7] transition-colors"
            >
              Generate Insights
            </button>
          </div>
        ) : (
          <>
            {/* Pain Points section */}
            {painPoints.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-[#1A1A2E] mb-3">
                  Your Pain Points
                </h2>
                <PainPointProgress
                  painPoints={painPoints}
                  stats={painPointStats}
                />
              </section>
            )}

            {/* Ask Steadii */}
            <section>
              <AskSteadii />
            </section>

            {/* Smart Recommendations */}
            {insights.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-[#1A1A2E] mb-3">
                  Smart Recommendations
                </h2>
                <div className="space-y-3">
                  {insights
                    .sort((a, b) => b.confidence - a.confidence)
                    .map((insight) => (
                      <InsightCard key={insight.id} insight={insight} />
                    ))}
                </div>
              </section>
            )}

            {/* Food Report Card */}
            {meals.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-[#1A1A2E] mb-3">
                  Food Report Card
                </h2>
                <FoodRanking meals={meals} />
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
