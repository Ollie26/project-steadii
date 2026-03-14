"use client";

import React, { useCallback } from "react";

export interface PainPoint {
  id: string;
  label: string;
  description: string;
}

export const PAIN_POINTS: PainPoint[] = [
  {
    id: "post_meal_spikes",
    label: "Post-meal spikes",
    description: "My blood sugar shoots up after eating",
  },
  {
    id: "overnight_lows",
    label: "Overnight lows",
    description: "I go low while sleeping",
  },
  {
    id: "dawn_phenomenon",
    label: "Dawn phenomenon",
    description: "I wake up with high blood sugar",
  },
  {
    id: "stress_highs",
    label: "Stress-related highs",
    description: "Stress makes my sugar hard to control",
  },
  {
    id: "exercise_unpredictability",
    label: "Exercise unpredictability",
    description: "Working out affects my sugar unpredictably",
  },
  {
    id: "carb_counting_fatigue",
    label: "Carb counting fatigue",
    description: "I'm tired of guessing carbs",
  },
  {
    id: "delayed_spikes",
    label: "Delayed spikes",
    description: "Some foods spike me hours later",
  },
  {
    id: "insulin_timing",
    label: "Insulin timing",
    description: "I never know when to dose",
  },
  {
    id: "roller_coaster",
    label: "Roller coaster days",
    description: "My sugar bounces between high and low",
  },
  {
    id: "social_eating",
    label: "Social eating stress",
    description: "Eating out is stressful to manage",
  },
];

interface PainPointsStepProps {
  selectedPoints: string[];
  onChange: (points: string[]) => void;
}

export default function PainPointsStep({
  selectedPoints,
  onChange,
}: PainPointsStepProps) {
  const togglePoint = useCallback(
    (id: string) => {
      if (selectedPoints.includes(id)) {
        onChange(selectedPoints.filter((p) => p !== id));
      } else {
        onChange([...selectedPoints, id]);
      }
    },
    [selectedPoints, onChange]
  );

  const moveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const newPoints = [...selectedPoints];
      [newPoints[index - 1], newPoints[index]] = [
        newPoints[index],
        newPoints[index - 1],
      ];
      onChange(newPoints);
    },
    [selectedPoints, onChange]
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index === selectedPoints.length - 1) return;
      const newPoints = [...selectedPoints];
      [newPoints[index], newPoints[index + 1]] = [
        newPoints[index + 1],
        newPoints[index],
      ];
      onChange(newPoints);
    },
    [selectedPoints, onChange]
  );

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = Number(e.dataTransfer.getData("text/plain"));
    if (dragIndex === dropIndex) return;

    const newPoints = [...selectedPoints];
    const [removed] = newPoints.splice(dragIndex, 1);
    newPoints.splice(dropIndex, 0, removed);
    onChange(newPoints);
  };

  const selectedPointDetails = selectedPoints
    .map((id) => PAIN_POINTS.find((p) => p.id === id))
    .filter(Boolean) as PainPoint[];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold" style={{ color: "#1A1A2E" }}>
          What do you struggle with most?
        </h1>
        <p className="text-lg" style={{ color: "#6B7280" }}>
          Pick all that apply, then drag to rank them.
        </p>
      </div>

      {/* Pain point cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PAIN_POINTS.map((point) => {
          const isSelected = selectedPoints.includes(point.id);
          const rankIndex = selectedPoints.indexOf(point.id);

          return (
            <button
              key={point.id}
              type="button"
              onClick={() => togglePoint(point.id)}
              className="relative flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-300 hover:scale-[1.01]"
              style={{
                backgroundColor: isSelected ? "#8B7EC8" : "#F8F7F5",
                borderColor: isSelected ? "#8B7EC8" : "transparent",
                color: isSelected ? "white" : "#1A1A2E",
                boxShadow: isSelected
                  ? "0 4px 16px rgba(139, 126, 200, 0.3)"
                  : "none",
              }}
            >
              {/* Check / rank badge */}
              <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={{
                  backgroundColor: isSelected
                    ? "rgba(255,255,255,0.25)"
                    : "#E5E7EB",
                  color: isSelected ? "white" : "#6B7280",
                }}
              >
                {isSelected ? (
                  rankIndex + 1
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect
                      x="1"
                      y="1"
                      width="12"
                      height="12"
                      rx="3"
                      stroke="#9CA3AF"
                      strokeWidth="1.5"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm leading-tight">
                  {point.label}
                </div>
                <div
                  className="text-xs mt-0.5 leading-snug"
                  style={{
                    color: isSelected ? "rgba(255,255,255,0.8)" : "#6B7280",
                  }}
                >
                  {point.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Ranked list */}
      {selectedPointDetails.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="h-px flex-1"
              style={{ backgroundColor: "#E5E7EB" }}
            />
            <span className="text-xs font-semibold px-2" style={{ color: "#6B7280" }}>
              YOUR PRIORITIES (drag to reorder)
            </span>
            <div
              className="h-px flex-1"
              style={{ backgroundColor: "#E5E7EB" }}
            />
          </div>

          <div className="space-y-2">
            {selectedPointDetails.map((point, index) => (
              <div
                key={point.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: "#F8F7F5" }}
              >
                {/* Drag handle */}
                <div className="flex-shrink-0 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="5" cy="4" r="1.5" fill="currentColor" />
                    <circle cx="11" cy="4" r="1.5" fill="currentColor" />
                    <circle cx="5" cy="8" r="1.5" fill="currentColor" />
                    <circle cx="11" cy="8" r="1.5" fill="currentColor" />
                    <circle cx="5" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="11" cy="12" r="1.5" fill="currentColor" />
                  </svg>
                </div>

                {/* Rank number */}
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: "#8B7EC8", color: "white" }}
                >
                  {index + 1}
                </div>

                {/* Label */}
                <span
                  className="flex-1 text-sm font-medium"
                  style={{ color: "#1A1A2E" }}
                >
                  {point.label}
                </span>

                {/* Up/Down buttons for accessibility */}
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveUp(index);
                    }}
                    disabled={index === 0}
                    className="p-0.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-30"
                    aria-label={`Move ${point.label} up`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 8.5L7 4.5L11 8.5"
                        stroke="#6B7280"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveDown(index);
                    }}
                    disabled={index === selectedPointDetails.length - 1}
                    className="p-0.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-30"
                    aria-label={`Move ${point.label} down`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 5.5L7 9.5L11 5.5"
                        stroke="#6B7280"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
