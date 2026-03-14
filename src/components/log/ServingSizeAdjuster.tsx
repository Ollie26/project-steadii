"use client";

import { useState } from "react";

interface ServingSizeAdjusterProps {
  value: number;
  onChange: (value: number) => void;
}

const QUICK_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 3];

export default function ServingSizeAdjuster({
  value,
  onChange,
}: ServingSizeAdjusterProps) {
  const [showSlider, setShowSlider] = useState(false);

  const label =
    value === 1 ? "1 serving" : `${value} servings`;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500 font-medium">{label}</p>

      <div className="flex items-center gap-1.5 flex-wrap">
        {QUICK_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              value === opt
                ? "bg-[#8B7EC8] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt}x
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowSlider((s) => !s)}
          className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          Custom
        </button>
      </div>

      {showSlider && (
        <div className="flex items-center gap-3 mt-1">
          <input
            type="range"
            min={0.25}
            max={5}
            step={0.25}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="flex-1 accent-[#8B7EC8] h-2"
          />
          <span className="text-xs text-gray-600 font-mono w-10 text-right">
            {value}x
          </span>
        </div>
      )}
    </div>
  );
}
