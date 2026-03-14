"use client";

import { useEffect, useState, useCallback } from "react";

interface Insight {
  title: string;
  body: string;
  category: string;
  confidence: string;
}

interface ActiveInsightProps {
  insights: Insight[];
}

const categoryIcons: Record<string, string> = {
  food: "\uD83D\uDCA1",
  stress: "\uD83E\uDDE0",
  exercise: "\uD83C\uDFC3",
  sleep: "\uD83D\uDE34",
  pattern: "\uD83D\uDCC8",
  medication: "\uD83D\uDC8A",
  general: "\u2728",
};

const confidenceDots: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const gradientBgs = [
  "from-[#8B7EC8]/5 to-[#4ECDC4]/5",
  "from-[#4ECDC4]/5 to-[#8B7EC8]/5",
  "from-[#F4A261]/5 to-[#8B7EC8]/5",
  "from-[#8B7EC8]/5 to-[#E76F6F]/5",
];

export default function ActiveInsight({ insights }: ActiveInsightProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToNext = useCallback(() => {
    if (insights.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % insights.length);
      setIsTransitioning(false);
    }, 200);
  }, [insights.length]);

  const goToPrev = useCallback(() => {
    if (insights.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(
        (prev) => (prev - 1 + insights.length) % insights.length
      );
      setIsTransitioning(false);
    }, 200);
  }, [insights.length]);

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (insights.length <= 1) return;
    const interval = setInterval(goToNext, 8000);
    return () => clearInterval(interval);
  }, [insights.length, goToNext]);

  if (insights.length === 0) return null;

  const insight = insights[activeIndex];
  const icon =
    categoryIcons[insight.category] || categoryIcons.general;
  const dots = confidenceDots[insight.confidence] || 2;
  const gradient = gradientBgs[activeIndex % gradientBgs.length];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-br ${gradient} p-4 shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-xl">{icon}</div>
          <div
            className={`transition-all duration-200 ${
              isTransitioning
                ? "translate-y-1 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            <h4 className="text-sm font-semibold text-[#1A1A2E]">
              {insight.title}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
              {insight.body}
            </p>
          </div>
        </div>

        {/* Navigation arrows */}
        {insights.length > 1 && (
          <div className="ml-2 flex flex-shrink-0 gap-1">
            <button
              onClick={goToPrev}
              className="rounded-full p-1 text-[#6B7280] transition-colors hover:bg-white/60 hover:text-[#1A1A2E]"
              aria-label="Previous insight"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="rounded-full p-1 text-[#6B7280] transition-colors hover:bg-white/60 hover:text-[#1A1A2E]"
              aria-label="Next insight"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Bottom bar: confidence + indicators */}
      <div className="mt-3 flex items-center justify-between">
        {/* Confidence indicator */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[#6B7280]">Confidence</span>
          <div className="ml-1 flex gap-0.5">
            {[1, 2, 3].map((level) => (
              <div
                key={level}
                className={`h-1.5 w-1.5 rounded-full ${
                  level <= dots ? "bg-[#8B7EC8]" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Page indicators */}
        {insights.length > 1 && (
          <div className="flex gap-1">
            {insights.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setActiveIndex(i);
                    setIsTransitioning(false);
                  }, 200);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "w-4 bg-[#8B7EC8]"
                    : "w-1.5 bg-gray-200 hover:bg-gray-300"
                }`}
                aria-label={`Go to insight ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
