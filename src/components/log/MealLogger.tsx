"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import FoodSearch from "./FoodSearch";
import BarcodeScanner from "./BarcodeScanner";
import PhotoCapture from "./PhotoCapture";
import ManualEntry from "./ManualEntry";
import MealItemCard, { type MealItem } from "./MealItemCard";
import GlycemicSelector from "./GlycemicSelector";

type Tab = "search" | "barcode" | "photo" | "manual";
type MealType = "breakfast" | "lunch" | "dinner" | "snack";
type GlycemicLevel = "low" | "medium" | "high";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: "search",
    label: "Search",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    key: "barcode",
    label: "Barcode",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M1 4.75C1 3.784 1.784 3 2.75 3h14.5c.966 0 1.75.784 1.75 1.75v10.515a1.75 1.75 0 01-1.75 1.75h-1.5a.75.75 0 01-.53-.22l-1.28-1.28a.75.75 0 01-.22-.53V7.25a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v6.985a.75.75 0 01-.22.53l-1.28 1.28a.75.75 0 01-.53.22h-1.5A1.75 1.75 0 011 15.265V4.75z" />
      </svg>
    ),
  },
  {
    key: "photo",
    label: "Photo",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10 14a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    key: "manual",
    label: "Manual",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
      </svg>
    ),
  },
];

const MEAL_TYPES: { key: MealType; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snack" },
];

function getAutoMealType(): MealType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 20) return "dinner";
  return "snack";
}

export default function MealLogger() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("search");
  const [items, setItems] = useState<MealItem[]>([]);
  const [mealType, setMealType] = useState<MealType>(getAutoMealType);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [glycemicEstimate, setGlycemicEstimate] = useState<GlycemicLevel | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  const addItem = useCallback((item: MealItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const adjustServing = useCallback((id: string, multiplier: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, servingMultiplier: multiplier } : i))
    );
  }, []);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const m = item.servingMultiplier;
        return {
          carbs: acc.carbs + Math.round(item.carbs * m),
          protein: acc.protein + Math.round(item.protein * m),
          fat: acc.fat + Math.round(item.fat * m),
          calories: acc.calories + Math.round(item.calories * m),
        };
      },
      { carbs: 0, protein: 0, fat: 0, calories: 0 }
    );
  }, [items]);

  const handleLogMeal = async () => {
    if (items.length === 0 || isLogging) return;

    setIsLogging(true);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType,
          items: items.map((item) => ({
            name: item.name,
            servingSize: item.servingSize,
            servingMultiplier: item.servingMultiplier,
            carbs: item.carbs,
            protein: item.protein,
            fat: item.fat,
            calories: item.calories,
            fiber: item.fiber,
            brand: item.brand,
          })),
          totalCarbs: totals.carbs,
          totalProtein: totals.protein,
          totalFat: totals.fat,
          totalCalories: totals.calories,
          notes: notes.trim() || undefined,
          isFavorite,
          glycemicEstimate,
          loggedAt: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        router.push("/");
      }
    } catch (err) {
      console.error("Failed to log meal:", err);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)]">
      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? "text-[#8B7EC8]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.icon}
              <span className="hidden min-[360px]:inline">{tab.label}</span>
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#8B7EC8] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 p-4 pb-0">
        <div className={activeTab === "search" ? "block" : "hidden"}>
          <FoodSearch onAddItem={addItem} />
        </div>
        <div className={activeTab === "barcode" ? "block" : "hidden"}>
          <BarcodeScanner onAddItem={addItem} />
        </div>
        <div className={activeTab === "photo" ? "block" : "hidden"}>
          <PhotoCapture onAddItem={addItem} />
        </div>
        <div className={activeTab === "manual" ? "block" : "hidden"}>
          <ManualEntry onAddItem={addItem} />
        </div>
      </div>

      {/* Bottom meal summary section -- always visible */}
      <div className="mt-auto sticky bottom-0 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        {/* Meal items summary */}
        <div className="px-4 pt-4 max-h-64 overflow-y-auto">
          {items.length > 0 ? (
            <div className="flex flex-col gap-2 mb-3">
              {items.map((item) => (
                <MealItemCard
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  onAdjustServing={adjustServing}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-3">
              No items added yet
            </p>
          )}

          {/* Quick totals bar */}
          {items.length > 0 && (
            <div className="flex items-center justify-between py-2 px-1 border-t border-gray-100 mb-2">
              <span className="text-xs font-medium text-gray-500">Totals</span>
              <div className="flex items-center gap-4 text-xs">
                <span className="font-bold text-[#8B7EC8]">
                  {totals.carbs}g carbs
                </span>
                <span className="text-gray-500">{totals.protein}g P</span>
                <span className="text-gray-500">{totals.fat}g F</span>
                <span className="text-gray-500">{totals.calories} cal</span>
              </div>
            </div>
          )}
        </div>

        {/* Meal config section */}
        <div className="px-4 pb-4 flex flex-col gap-3">
          {/* Meal type pills */}
          <div className="flex gap-2">
            {MEAL_TYPES.map((mt) => (
              <button
                key={mt.key}
                type="button"
                onClick={() => setMealType(mt.key)}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                  mealType === mt.key
                    ? "bg-[#8B7EC8] text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {mt.label}
              </button>
            ))}
          </div>

          {/* Glycemic estimate */}
          <GlycemicSelector
            value={glycemicEstimate}
            onChange={setGlycemicEstimate}
          />

          {/* Notes + Favorite row */}
          <div className="flex items-center gap-2">
            {/* Notes toggle */}
            <button
              type="button"
              onClick={() => setShowNotes((s) => !s)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-colors ${
                showNotes || notes
                  ? "bg-[#8B7EC8]/10 text-[#8B7EC8]"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z"
                  clipRule="evenodd"
                />
              </svg>
              Notes
            </button>

            {/* Favorite toggle */}
            <button
              type="button"
              onClick={() => setIsFavorite((f) => !f)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-colors ${
                isFavorite
                  ? "bg-yellow-50 text-yellow-600"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                {isFavorite ? (
                  <path
                    fillRule="evenodd"
                    d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
              {isFavorite ? "Favorited" : "Favorite"}
            </button>
          </div>

          {/* Collapsible notes */}
          {showNotes && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this meal..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/40 focus:border-[#8B7EC8] resize-none transition-all"
            />
          )}

          {/* Log Meal button */}
          <button
            type="button"
            onClick={handleLogMeal}
            disabled={items.length === 0 || isLogging}
            className={`w-full py-4 rounded-full text-base font-bold transition-all ${
              items.length > 0 && !isLogging
                ? "bg-[#8B7EC8] text-white hover:bg-[#7a6db7] shadow-md active:scale-[0.98]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isLogging ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Logging...
              </span>
            ) : items.length > 0 ? (
              `Log ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} (${totals.carbs}g carbs)`
            ) : (
              "Add foods to log"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
