'use client';

import React, { useState } from 'react';
import BGImpactChart from './BGImpactChart';
import MealCommentary from './MealCommentary';

interface MealItem {
  name: string;
  carbsGrams?: number;
  proteinGrams?: number;
  fatGrams?: number;
  calories?: number;
}

interface BGReading {
  timestamp: string;
  value: number;
}

interface BGImpact {
  peakDelta: number;
  timeToPeakMinutes: number;
  tirPercent: number;
  classification: string;
  preMealBG: number;
  peakBG: number;
}

interface Meal {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: string;
  carbsGrams: number;
  proteinGrams?: number;
  fatGrams?: number;
  calories?: number;
  tirColor: 'green' | 'amber' | 'red';
  tirScore?: number;
  photoUrl?: string;
  isFavorite: boolean;
  items?: MealItem[];
  bgImpact?: BGImpact;
  notes?: string;
}

interface MealDetailProps {
  meal: Meal;
  bgReadings?: BGReading[];
  targetLow?: number;
  targetHigh?: number;
  similarMeals?: Meal[];
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
}

const tirColorMap: Record<string, string> = {
  green: '#4ECDC4',
  amber: '#F4A261',
  red: '#E76F6F',
};

const classificationLabels: Record<string, { label: string; color: string }> = {
  excellent: { label: 'Excellent', color: '#4ECDC4' },
  good: { label: 'Good', color: '#4ECDC4' },
  moderate: { label: 'Moderate', color: '#F4A261' },
  poor: { label: 'Needs Attention', color: '#E76F6F' },
};

export default function MealDetail({
  meal,
  bgReadings = [],
  targetLow = 70,
  targetHigh = 180,
  similarMeals = [],
  onEdit,
  onDelete,
  onToggleFavorite,
}: MealDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const date = new Date(meal.timestamp);
  const dateStr = date.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const classification = meal.bgImpact?.classification
    ? classificationLabels[meal.bgImpact.classification] || {
        label: meal.bgImpact.classification,
        color: '#6B7280',
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: tirColorMap[meal.tirColor] }}
            />
            <span className="text-xs text-[#6B7280] capitalize">
              {meal.mealType}
            </span>
            <span className="text-xs text-gray-300">|</span>
            <span className="text-xs text-[#6B7280]">{timeStr}</span>
          </div>
          <h2 className="text-xl font-bold text-[#1A1A2E]">{meal.name}</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">{dateStr}</p>
        </div>

        {/* Favorite toggle */}
        <button
          onClick={onToggleFavorite}
          className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg
            className={`w-6 h-6 ${
              meal.isFavorite
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
            viewBox="0 0 20 20"
            fill={meal.isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={meal.isFavorite ? 0 : 1.5}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      </div>

      {/* Photo */}
      {meal.photoUrl && (
        <div className="rounded-xl overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meal.photoUrl}
            alt={meal.name || 'Meal photo'}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      {/* Macro summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Carbs', value: `${meal.carbsGrams}g`, primary: true },
          {
            label: 'Protein',
            value: meal.proteinGrams ? `${meal.proteinGrams}g` : '--',
          },
          { label: 'Fat', value: meal.fatGrams ? `${meal.fatGrams}g` : '--' },
          {
            label: 'Calories',
            value: meal.calories ? `${meal.calories}` : '--',
          },
        ].map((macro) => (
          <div
            key={macro.label}
            className={`text-center p-3 rounded-xl ${
              macro.primary ? 'bg-[#8B7EC8]/10' : 'bg-gray-50'
            }`}
          >
            <p
              className={`text-lg font-bold ${
                macro.primary ? 'text-[#8B7EC8]' : 'text-[#1A1A2E]'
              }`}
            >
              {macro.value}
            </p>
            <p className="text-xs text-[#6B7280]">{macro.label}</p>
          </div>
        ))}
      </div>

      {/* Meal items breakdown */}
      {meal.items && meal.items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <h3 className="text-sm font-semibold text-[#1A1A2E] px-4 pt-4 pb-2">
            Meal Items
          </h3>
          <div className="divide-y divide-gray-50">
            {meal.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[#1A1A2E]">{item.name}</span>
                <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                  {item.carbsGrams !== undefined && (
                    <span>{item.carbsGrams}g C</span>
                  )}
                  {item.proteinGrams !== undefined && (
                    <span>{item.proteinGrams}g P</span>
                  )}
                  {item.fatGrams !== undefined && (
                    <span>{item.fatGrams}g F</span>
                  )}
                  {item.calories !== undefined && (
                    <span>{item.calories} cal</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Post-meal BG chart */}
      {bgReadings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-[#1A1A2E] mb-3">
            Post-Meal Glucose Response
          </h3>
          <BGImpactChart
            readings={bgReadings}
            targetLow={targetLow}
            targetHigh={targetHigh}
            mealTimestamp={meal.timestamp}
            height={300}
          />
        </div>
      )}

      {/* BG impact stats */}
      {meal.bgImpact && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-[#6B7280] mb-1">Peak Rise</p>
            <p className="text-xl font-bold text-[#1A1A2E]">
              +{meal.bgImpact.peakDelta}{' '}
              <span className="text-sm font-normal text-[#6B7280]">mg/dL</span>
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-[#6B7280] mb-1">Time to Peak</p>
            <p className="text-xl font-bold text-[#1A1A2E]">
              {meal.bgImpact.timeToPeakMinutes}{' '}
              <span className="text-sm font-normal text-[#6B7280]">min</span>
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-[#6B7280] mb-1">Time in Range</p>
            <p className="text-xl font-bold" style={{ color: tirColorMap[meal.tirColor] }}>
              {meal.bgImpact.tirPercent}%
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-[#6B7280] mb-1">Classification</p>
            {classification && (
              <p
                className="text-lg font-bold"
                style={{ color: classification.color }}
              >
                {classification.label}
              </p>
            )}
          </div>
        </div>
      )}

      {/* AI Commentary */}
      <MealCommentary mealId={meal.id} />

      {/* Similar meals */}
      {similarMeals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#1A1A2E] mb-3">
            Similar Meals
          </h3>
          <div className="space-y-2">
            {similarMeals.map((similar) => (
              <a
                key={similar.id}
                href={`/meals/${similar.id}`}
                className="flex items-center justify-between bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tirColorMap[similar.tirColor] }}
                  />
                  <span className="text-sm text-[#1A1A2E]">{similar.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                  <span>{similar.carbsGrams}g carbs</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {meal.notes && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
            Notes
          </h3>
          <p className="text-sm text-[#1A1A2E]">{meal.notes}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onEdit}
          className="flex-1 py-3 px-4 bg-[#8B7EC8] text-white rounded-xl font-medium text-sm hover:bg-[#7A6DB7] transition-colors"
        >
          Edit Meal
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="py-3 px-4 bg-white border border-red-200 text-[#E76F6F] rounded-xl font-medium text-sm hover:bg-red-50 transition-colors"
        >
          Delete
        </button>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">
              Delete Meal?
            </h3>
            <p className="text-sm text-[#6B7280] mb-6">
              This will permanently delete &ldquo;{meal.name}&rdquo; and its
              associated data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-gray-100 text-[#1A1A2E] rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete?.();
                }}
                className="flex-1 py-2.5 px-4 bg-[#E76F6F] text-white rounded-xl font-medium text-sm hover:bg-[#d65f5f] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
