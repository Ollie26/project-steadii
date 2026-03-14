'use client';

import React from 'react';

interface Insight {
  id: string;
  title: string;
  body: string;
  actionable?: string;
  category: 'food' | 'time' | 'stress' | 'exercise' | 'sleep' | 'general' | 'warning';
  confidence: number; // 1-3
  dataPoints?: number;
  source: 'AI' | 'Basic';
}

interface InsightCardProps {
  insight: Insight;
}

const categoryIcons: Record<string, React.ReactNode> = {
  food: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 8M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  ),
  time: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  stress: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  exercise: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  sleep: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  general: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2a1 1 0 011 1v1.323l1.954.674a1 1 0 01.09 1.82L11 7.86V10a1 1 0 11-2 0V7.86L6.956 6.817a1 1 0 01.09-1.82L9 4.323V3a1 1 0 011-1zm-5 9a1 1 0 011 1v.586l.707-.293a1 1 0 01.828 1.818L6 14.818V16a1 1 0 11-2 0v-1.182l-1.535-.707a1 1 0 01.828-1.818L4 12.586V12a1 1 0 011-1zm10 0a1 1 0 011 1v.586l.707-.293a1 1 0 01.828 1.818L16 14.818V16a1 1 0 11-2 0v-1.182l-1.535-.707a1 1 0 01.828-1.818L14 12.586V12a1 1 0 011-1z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
};

const categoryColors: Record<string, string> = {
  food: '#F4A261',
  time: '#8B7EC8',
  stress: '#E76F6F',
  exercise: '#4ECDC4',
  sleep: '#6366f1',
  general: '#8B7EC8',
  warning: '#E76F6F',
};

export default function InsightCard({ insight }: InsightCardProps) {
  const iconColor = categoryColors[insight.category] || '#8B7EC8';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${iconColor}15`, color: iconColor }}
        >
          {categoryIcons[insight.category] || categoryIcons.general}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + source badge */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-[#1A1A2E] leading-snug">
              {insight.title}
            </h3>
            <span
              className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                insight.source === 'AI'
                  ? 'bg-[#8B7EC8]/10 text-[#8B7EC8]'
                  : 'bg-gray-100 text-[#6B7280]'
              }`}
            >
              {insight.source}
            </span>
          </div>

          {/* Body */}
          <p className="text-sm text-[#6B7280] leading-relaxed mb-2">
            {insight.body}
          </p>

          {/* Actionable recommendation */}
          {insight.actionable && (
            <div className="flex items-start gap-1.5 mb-3">
              <svg
                className="w-3.5 h-3.5 text-[#8B7EC8] mt-0.5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              <p className="text-sm text-[#8B7EC8] font-medium">
                {insight.actionable}
              </p>
            </div>
          )}

          {/* Bottom row: confidence + data points */}
          <div className="flex items-center gap-4">
            {/* Confidence dots */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#6B7280] mr-1">Confidence</span>
              {[1, 2, 3].map((dot) => (
                <span
                  key={dot}
                  className={`w-1.5 h-1.5 rounded-full ${
                    dot <= insight.confidence
                      ? 'bg-[#8B7EC8]'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Data points */}
            {insight.dataPoints !== undefined && insight.dataPoints > 0 && (
              <span className="text-[10px] text-[#6B7280]">
                Based on {insight.dataPoints}{' '}
                {insight.dataPoints === 1 ? 'data point' : 'data points'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
