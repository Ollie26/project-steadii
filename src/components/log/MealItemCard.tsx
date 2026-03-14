"use client";

import { useState } from "react";
import ServingSizeAdjuster from "./ServingSizeAdjuster";

export interface MealItem {
  id: string;
  name: string;
  servingSize: string;
  servingMultiplier: number;
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
  fiber?: number;
  brand?: string;
}

interface MealItemCardProps {
  item: MealItem;
  onRemove: (id: string) => void;
  onAdjustServing: (id: string, multiplier: number) => void;
}

export default function MealItemCard({
  item,
  onRemove,
  onAdjustServing,
}: MealItemCardProps) {
  const [expanded, setExpanded] = useState(false);

  const m = item.servingMultiplier;
  const carbs = Math.round(item.carbs * m);
  const protein = Math.round(item.protein * m);
  const fat = Math.round(item.fat * m);
  const calories = Math.round(item.calories * m);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-2.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex-1 text-left min-w-0"
        >
          <p className="text-sm font-medium text-gray-800 truncate">
            {item.name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {item.servingSize}
            {m !== 1 ? ` x${m}` : ""}
          </p>
        </button>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-sm font-bold text-[#8B7EC8]">{carbs}g</p>
            <p className="text-[10px] text-gray-400">carbs</p>
          </div>
          <div className="text-right hidden min-[400px]:block">
            <p className="text-xs text-gray-500">{protein}g</p>
            <p className="text-[10px] text-gray-400">protein</p>
          </div>
          <div className="text-right hidden min-[400px]:block">
            <p className="text-xs text-gray-500">{fat}g</p>
            <p className="text-[10px] text-gray-400">fat</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">{calories}</p>
            <p className="text-[10px] text-gray-400">cal</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
            aria-label="Remove item"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <ServingSizeAdjuster
            value={m}
            onChange={(val) => onAdjustServing(item.id, val)}
          />
          <div className="mt-2 grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-xs font-semibold text-[#8B7EC8]">{carbs}g</p>
              <p className="text-[10px] text-gray-400">Carbs</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">{protein}g</p>
              <p className="text-[10px] text-gray-400">Protein</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">{fat}g</p>
              <p className="text-[10px] text-gray-400">Fat</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">{calories}</p>
              <p className="text-[10px] text-gray-400">Cal</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
