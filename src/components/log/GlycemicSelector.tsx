"use client";

import { useState } from "react";

interface GlycemicSelectorProps {
  value: "low" | "medium" | "high" | null;
  onChange: (value: "low" | "medium" | "high") => void;
}

const OPTIONS: {
  key: "low" | "medium" | "high";
  label: string;
  color: string;
  activeBg: string;
  tooltip: string;
}[] = [
  {
    key: "low",
    label: "Low GI",
    color: "text-[#4ECDC4]",
    activeBg: "bg-[#4ECDC4]",
    tooltip: "Slow, steady rise in blood sugar. Examples: lentils, most vegetables, nuts.",
  },
  {
    key: "medium",
    label: "Med GI",
    color: "text-[#F4A261]",
    activeBg: "bg-[#F4A261]",
    tooltip: "Moderate blood sugar rise. Examples: brown rice, whole wheat bread, oatmeal.",
  },
  {
    key: "high",
    label: "High GI",
    color: "text-[#E76F6F]",
    activeBg: "bg-[#E76F6F]",
    tooltip: "Rapid blood sugar spike. Examples: white bread, sugary drinks, white rice.",
  },
];

export default function GlycemicSelector({
  value,
  onChange,
}: GlycemicSelectorProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">
        Glycemic Estimate
      </label>
      <div className="flex gap-2 relative">
        {OPTIONS.map((opt) => {
          const isActive = value === opt.key;
          return (
            <div key={opt.key} className="relative flex-1">
              <button
                type="button"
                onClick={() => onChange(opt.key)}
                onMouseEnter={() => setHoveredKey(opt.key)}
                onMouseLeave={() => setHoveredKey(null)}
                className={`w-full px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? `${opt.activeBg} text-white shadow-sm`
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
              {hoveredKey === opt.key && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-20 pointer-events-none">
                  {opt.tooltip}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45 -mt-1" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
