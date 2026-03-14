"use client";

import { useMemo } from "react";

interface DayNavigatorProps {
  currentDate: Date;
  onChange: (date: Date) => void;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(date: Date): string {
  const today = new Date();
  if (isSameDay(date, today)) return "Today";

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function DayNavigator({
  currentDate,
  onChange,
}: DayNavigatorProps) {
  const isToday = useMemo(
    () => isSameDay(currentDate, new Date()),
    [currentDate]
  );

  const goToPreviousDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    onChange(prev);
  };

  const goToNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    // Don't go past today
    if (next <= new Date()) {
      onChange(next);
    }
  };

  const goToToday = () => {
    onChange(new Date());
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={goToPreviousDay}
          className="rounded-lg p-1.5 text-[#6B7280] transition-colors hover:bg-gray-100 hover:text-[#1A1A2E]"
          aria-label="Previous day"
        >
          <svg
            className="h-5 w-5"
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

        <span className="min-w-[120px] text-center text-sm font-semibold text-[#1A1A2E]">
          {formatDate(currentDate)}
        </span>

        <button
          onClick={goToNextDay}
          disabled={isToday}
          className={`rounded-lg p-1.5 transition-colors ${
            isToday
              ? "cursor-not-allowed text-gray-200"
              : "text-[#6B7280] hover:bg-gray-100 hover:text-[#1A1A2E]"
          }`}
          aria-label="Next day"
        >
          <svg
            className="h-5 w-5"
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

      {!isToday && (
        <button
          onClick={goToToday}
          className="rounded-lg bg-[#8B7EC8]/10 px-3 py-1 text-xs font-medium text-[#8B7EC8] transition-colors hover:bg-[#8B7EC8]/20"
        >
          Today
        </button>
      )}
    </div>
  );
}
