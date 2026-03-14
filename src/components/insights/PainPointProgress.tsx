'use client';

import React from 'react';

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

interface PainPointProgressProps {
  painPoints: PainPoint[];
  stats: PainPointStat[];
}

const trendConfig = {
  improving: {
    color: '#4ECDC4',
    bgColor: '#4ECDC4',
    label: 'Improving',
    arrow: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ),
  },
  worsening: {
    color: '#E76F6F',
    bgColor: '#E76F6F',
    label: 'Needs work',
    arrow: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    ),
  },
  stable: {
    color: '#F4A261',
    bgColor: '#F4A261',
    label: 'Stable',
    arrow: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    ),
  },
};

export default function PainPointProgress({
  painPoints,
  stats,
}: PainPointProgressProps) {
  const activePainPoints = painPoints.filter((pp) => pp.active);

  if (activePainPoints.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <p className="text-sm text-[#6B7280]">
          No active pain points. Add some in your profile to track progress.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activePainPoints.map((pp) => {
        const stat = stats.find((s) => s.painPointId === pp.id);
        const trend = stat ? trendConfig[stat.trend] : null;

        const delta = stat
          ? Math.abs(stat.currentValue - stat.previousValue).toFixed(1)
          : null;

        return (
          <div
            key={pp.id}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-[#1A1A2E]">
                {pp.label}
              </h4>
              {trend && (
                <div
                  className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                  style={{
                    color: trend.color,
                    backgroundColor: `${trend.bgColor}15`,
                  }}
                >
                  {trend.arrow}
                  {trend.label}
                </div>
              )}
            </div>

            {stat ? (
              <div className="flex items-end gap-3">
                <div>
                  <p className="text-2xl font-bold text-[#1A1A2E]">
                    {stat.currentValue}
                    <span className="text-sm font-normal text-[#6B7280] ml-1">
                      {stat.unit}
                    </span>
                  </p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {stat.metric}
                  </p>
                </div>

                {delta && stat.previousValue > 0 && (
                  <div className="text-xs text-[#6B7280] pb-1">
                    <span
                      style={{ color: trend?.color }}
                    >
                      {stat.trend === 'improving' ? '-' : stat.trend === 'worsening' ? '+' : ''}
                      {delta} {stat.unit}
                    </span>{' '}
                    vs last week
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#6B7280]">
                Not enough data yet to track progress
              </p>
            )}

            {/* Simple progress bar */}
            {stat && (
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(10, stat.currentValue))}%`,
                    backgroundColor: trend?.color || '#8B7EC8',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
