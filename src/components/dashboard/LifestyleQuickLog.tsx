"use client";

import { useState, useMemo, useCallback } from "react";

type LogCategory = "sleep" | "stress" | "exercise";

const stressEmojis = [
  { value: 1, emoji: "\uD83D\uDE0C", label: "Calm" },
  { value: 2, emoji: "\uD83D\uDE42", label: "Low" },
  { value: 3, emoji: "\uD83D\uDE10", label: "Moderate" },
  { value: 4, emoji: "\uD83D\uDE1F", label: "High" },
  { value: 5, emoji: "\uD83E\uDD2F", label: "Very High" },
];

const sleepEmojis = [
  { value: 1, emoji: "\uD83D\uDE29", label: "Terrible" },
  { value: 2, emoji: "\uD83D\uDE14", label: "Poor" },
  { value: 3, emoji: "\uD83D\uDE10", label: "Okay" },
  { value: 4, emoji: "\uD83D\uDE0A", label: "Good" },
  { value: 5, emoji: "\uD83E\uDD29", label: "Great" },
];

const exerciseTypes = [
  { value: "run", label: "Run", icon: "\uD83C\uDFC3" },
  { value: "lift", label: "Lift", icon: "\uD83C\uDFCB\uFE0F" },
  { value: "walk", label: "Walk", icon: "\uD83D\uDEB6" },
  { value: "yoga", label: "Yoga", icon: "\uD83E\uDDD8" },
  { value: "other", label: "Other", icon: "\u26A1" },
];

function getDefaultCategory(): LogCategory {
  const hour = new Date().getHours();
  if (hour < 12) return "sleep";
  if (hour < 17) return "stress";
  return "exercise";
}

export default function LifestyleQuickLog() {
  const defaultCategory = useMemo(() => getDefaultCategory(), []);
  const [activeCategory, setActiveCategory] =
    useState<LogCategory>(defaultCategory);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [selectedStress, setSelectedStress] = useState<number | null>(null);
  const [selectedSleep, setSelectedSleep] = useState<number | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const handleLog = useCallback(
    async (category: LogCategory, value: number | string) => {
      setSubmitting(true);
      try {
        await fetch("/api/lifestyle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            value,
            timestamp: new Date().toISOString(),
          }),
        });
        setSubmitted(category);
        setTimeout(() => setSubmitted(null), 2000);
      } catch {
        // Silently handle for now
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  const categories: { key: LogCategory; label: string; icon: string }[] = [
    { key: "sleep", label: "Sleep", icon: "\uD83D\uDCA4" },
    { key: "stress", label: "Stress", icon: "\uD83E\uDDE0" },
    { key: "exercise", label: "Exercise", icon: "\uD83D\uDCAA" },
  ];

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      {/* Category tabs */}
      <div className="mb-3 flex gap-1 rounded-lg bg-gray-50 p-0.5">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all duration-200 ${
              activeCategory === cat.key
                ? "bg-white text-[#1A1A2E] shadow-sm"
                : "text-[#6B7280] hover:text-[#1A1A2E]"
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Success feedback */}
      {submitted && (
        <div className="mb-3 rounded-lg bg-[#4ECDC4]/10 px-3 py-2 text-center text-xs font-medium text-[#4ECDC4]">
          Logged! Keep it up.
        </div>
      )}

      {/* Sleep section */}
      {activeCategory === "sleep" && (
        <div>
          <p className="mb-2.5 text-center text-sm text-[#6B7280]">
            How&apos;d you sleep?
          </p>
          <div className="flex justify-center gap-2">
            {sleepEmojis.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setSelectedSleep(item.value);
                  handleLog("sleep", item.value);
                }}
                disabled={submitting}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all duration-200 ${
                  selectedSleep === item.value
                    ? "bg-[#8B7EC8]/10 ring-2 ring-[#8B7EC8]/30"
                    : "hover:bg-gray-50"
                } ${submitting ? "opacity-50" : ""}`}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-[10px] text-[#6B7280]">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stress section */}
      {activeCategory === "stress" && (
        <div>
          <p className="mb-2.5 text-center text-sm text-[#6B7280]">
            How&apos;s your stress?
          </p>
          <div className="flex justify-center gap-2">
            {stressEmojis.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setSelectedStress(item.value);
                  handleLog("stress", item.value);
                }}
                disabled={submitting}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all duration-200 ${
                  selectedStress === item.value
                    ? "bg-[#8B7EC8]/10 ring-2 ring-[#8B7EC8]/30"
                    : "hover:bg-gray-50"
                } ${submitting ? "opacity-50" : ""}`}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-[10px] text-[#6B7280]">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exercise section */}
      {activeCategory === "exercise" && (
        <div>
          <p className="mb-2.5 text-center text-sm text-[#6B7280]">
            Exercise today?
          </p>
          <div className="flex justify-center gap-2">
            {exerciseTypes.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setSelectedExercise(item.value);
                  handleLog("exercise", item.value);
                }}
                disabled={submitting}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all duration-200 ${
                  selectedExercise === item.value
                    ? "bg-[#8B7EC8]/10 ring-2 ring-[#8B7EC8]/30"
                    : "hover:bg-gray-50"
                } ${submitting ? "opacity-50" : ""}`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-[10px] text-[#6B7280]">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
