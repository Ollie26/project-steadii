"use client";

import { useState } from "react";
import type { MealItem } from "./MealItemCard";

interface ManualEntryProps {
  onAddItem: (item: MealItem) => void;
}

function NumericStepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  unit = "g",
  large = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  unit?: string;
  large?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div className="relative flex-1">
          <input
            type="number"
            value={value || ""}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              onChange(isNaN(v) ? 0 : Math.max(min, v));
            }}
            min={min}
            step={step}
            className={`w-full text-center rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/40 focus:border-[#8B7EC8] transition-all ${
              large
                ? "py-3 text-2xl font-bold text-[#8B7EC8]"
                : "py-2 text-base text-gray-800"
            }`}
          />
          <span
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none ${
              large ? "text-sm" : "text-xs"
            }`}
          >
            {unit}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onChange(value + step)}
          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function ManualEntry({ onAddItem }: ManualEntryProps) {
  const [name, setName] = useState("");
  const [carbs, setCarbs] = useState(0);
  const [protein, setProtein] = useState(0);
  const [fat, setFat] = useState(0);
  const [fiber, setFiber] = useState(0);
  const [calories, setCalories] = useState(0);

  const canAdd = name.trim().length > 0 && carbs > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    onAddItem({
      id: crypto.randomUUID(),
      name: name.trim(),
      servingSize: "1 serving",
      servingMultiplier: 1,
      carbs,
      protein,
      fat,
      calories: calories || Math.round(carbs * 4 + protein * 4 + fat * 9),
      fiber: fiber || undefined,
    });
    // Reset
    setName("");
    setCarbs(0);
    setProtein(0);
    setFat(0);
    setFiber(0);
    setCalories(0);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Name */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
          Food Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Grilled chicken sandwich"
          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/40 focus:border-[#8B7EC8] transition-all"
        />
      </div>

      {/* Carbs - prominent */}
      <NumericStepper
        label="Total Carbs (required)"
        value={carbs}
        onChange={setCarbs}
        step={5}
        unit="g"
        large
      />

      {/* Secondary macros */}
      <div className="grid grid-cols-2 gap-3">
        <NumericStepper
          label="Protein"
          value={protein}
          onChange={setProtein}
          step={1}
          unit="g"
        />
        <NumericStepper
          label="Fat"
          value={fat}
          onChange={setFat}
          step={1}
          unit="g"
        />
        <NumericStepper
          label="Fiber"
          value={fiber}
          onChange={setFiber}
          step={1}
          unit="g"
        />
        <NumericStepper
          label="Calories"
          value={calories}
          onChange={setCalories}
          step={10}
          unit="cal"
        />
      </div>

      {!calories && (carbs > 0 || protein > 0 || fat > 0) && (
        <p className="text-xs text-gray-400 -mt-2">
          Estimated:{" "}
          {Math.round(carbs * 4 + protein * 4 + fat * 9)} cal
        </p>
      )}

      {/* Add button */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={!canAdd}
        className={`w-full py-3.5 rounded-full text-base font-semibold transition-all ${
          canAdd
            ? "bg-[#8B7EC8] text-white hover:bg-[#7a6db7] shadow-sm"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        Add to Meal
      </button>
    </div>
  );
}
