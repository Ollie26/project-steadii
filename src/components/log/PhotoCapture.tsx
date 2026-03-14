"use client";

import { useState, useRef, useCallback } from "react";
import type { MealItem } from "./MealItemCard";

interface PhotoCaptureProps {
  onAddItem: (item: MealItem) => void;
  aiEnabled?: boolean;
}

interface AnalyzedFood {
  name: string;
  servingSize: string;
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
}

export default function PhotoCapture({
  onAddItem,
  aiEnabled = false,
}: PhotoCaptureProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedFoods, setAnalyzedFoods] = useState<AnalyzedFood[]>([]);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const generateThumbnail = useCallback(
    (base64: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 50;
          canvas.height = 50;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const size = Math.min(img.width, img.height);
            const sx = (img.width - size) / 2;
            const sy = (img.height - size) / 2;
            ctx.drawImage(img, sx, sy, size, size, 0, 0, 50, 50);
          }
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.src = base64;
      });
    },
    []
  );

  const handleFile = useCallback(
    async (file: File) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setPhoto(base64);

        if (aiEnabled) {
          setAnalyzing(true);
          try {
            const thumbnail = await generateThumbnail(base64);
            const res = await fetch("/api/ai/analyze-photo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image: base64, thumbnail }),
            });
            if (res.ok) {
              const data = await res.json();
              const foods: AnalyzedFood[] = Array.isArray(data.foods)
                ? data.foods
                : [];
              setAnalyzedFoods(foods);
              // Auto-add all identified foods
              foods.forEach((food) => {
                onAddItem({
                  id: crypto.randomUUID(),
                  name: food.name,
                  servingSize: food.servingSize,
                  servingMultiplier: 1,
                  carbs: food.carbs,
                  protein: food.protein,
                  fat: food.fat,
                  calories: food.calories,
                });
              });
            }
          } catch {
            // AI analysis failed silently
          } finally {
            setAnalyzing(false);
          }
        }
      };
      reader.readAsDataURL(file);
    },
    [aiEnabled, onAddItem, generateThumbnail]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearPhoto = () => {
    setPhoto(null);
    setAnalyzedFoods([]);
    setShowManualSearch(false);
    setAnalyzing(false);
  };

  return (
    <div className="flex flex-col gap-5">
      {!photo && (
        <>
          {/* Capture buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex flex-col items-center gap-3 py-8 rounded-2xl bg-[#8B7EC8]/5 border-2 border-dashed border-[#8B7EC8]/30 hover:border-[#8B7EC8]/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-[#8B7EC8]/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-7 h-7 text-[#8B7EC8]"
                >
                  <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
                  <path
                    fillRule="evenodd"
                    d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3H4.5a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-[#8B7EC8]">
                Take Photo
              </span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex flex-col items-center gap-3 py-8 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-7 h-7 text-gray-500"
                >
                  <path
                    fillRule="evenodd"
                    d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-600">
                From Gallery
              </span>
            </button>
          </div>

          {/* Hidden inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleInputChange}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />

          {!aiEnabled && (
            <div className="bg-[#8B7EC8]/5 rounded-xl px-4 py-3 text-center">
              <p className="text-sm text-[#8B7EC8]">
                Enable AI in settings for automatic food analysis
              </p>
            </div>
          )}
        </>
      )}

      {photo && (
        <>
          {/* Photo preview */}
          <div className="relative rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt="Food photo"
              className="w-full max-h-64 object-cover"
            />
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          {/* Analyzing state */}
          {analyzing && (
            <div className="flex items-center justify-center gap-3 py-6">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-[#8B7EC8] rounded-full animate-spin" />
              <p className="text-sm text-gray-500 font-medium">
                Analyzing your food...
              </p>
            </div>
          )}

          {/* AI results */}
          {!analyzing && aiEnabled && analyzedFoods.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-gray-700">
                Identified Foods
              </p>
              {analyzedFoods.map((food, i) => (
                <div
                  key={i}
                  className="bg-[#4ECDC4]/5 border border-[#4ECDC4]/20 rounded-xl px-3 py-2.5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {food.name}
                    </p>
                    <p className="text-xs text-gray-400">{food.servingSize}</p>
                  </div>
                  <p className="text-sm font-bold text-[#8B7EC8]">
                    {food.carbs}g carbs
                  </p>
                </div>
              ))}
              <p className="text-xs text-[#4ECDC4] text-center mt-1">
                Foods added to your meal
              </p>
            </div>
          )}

          {/* Non-AI flow */}
          {!analyzing && !aiEnabled && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500 text-center">
                Photo saved. Add nutrition info manually.
              </p>
              {!showManualSearch && (
                <button
                  type="button"
                  onClick={() => setShowManualSearch(true)}
                  className="py-3 rounded-full bg-[#8B7EC8] text-white text-sm font-semibold hover:bg-[#7a6db7] transition-colors"
                >
                  Add Nutrition Info
                </button>
              )}
              {showManualSearch && (
                <p className="text-sm text-gray-500 text-center">
                  Use the Search or Manual tab to add nutrition details.
                </p>
              )}
            </div>
          )}

          {/* AI enabled but no results */}
          {!analyzing && aiEnabled && analyzedFoods.length === 0 && photo && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                Could not identify foods in this photo.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Try the Search tab to add foods manually.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
