'use client';

import React, { useState, useEffect, useCallback } from 'react';

export default function TargetRangeSlider() {
  const [low, setLow] = useState(70);
  const [high, setHigh] = useState(180);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const MIN = 50;
  const MAX = 300;

  useEffect(() => {
    async function fetchRange() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.targetLow) setLow(data.targetLow);
          if (data.targetHigh) setHigh(data.targetHigh);
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchRange();
  }, []);

  const saveRange = useCallback(
    async (newLow: number, newHigh: number) => {
      setSaving(true);
      setSaved(false);
      try {
        const res = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetLow: newLow, targetHigh: newHigh }),
        });
        if (res.ok) {
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        }
      } catch {
        console.error('Failed to save target range');
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const handleLowChange = (value: number) => {
    const clamped = Math.min(Math.max(value, MIN), high - 10);
    setLow(clamped);
  };

  const handleHighChange = (value: number) => {
    const clamped = Math.max(Math.min(value, MAX), low + 10);
    setHigh(clamped);
  };

  if (loading) {
    return <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />;
  }

  // Calculate positions for the visual bar
  const lowPercent = ((low - MIN) / (MAX - MIN)) * 100;
  const highPercent = ((high - MIN) / (MAX - MIN)) * 100;

  return (
    <div className="space-y-4">
      {/* Visual range bar */}
      <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
        {/* Low zone */}
        <div
          className="absolute top-0 left-0 h-full bg-[#E76F6F]/20 rounded-l-full"
          style={{ width: `${lowPercent}%` }}
        />
        {/* Target zone */}
        <div
          className="absolute top-0 h-full bg-[#4ECDC4]/20"
          style={{
            left: `${lowPercent}%`,
            width: `${highPercent - lowPercent}%`,
          }}
        />
        {/* High zone */}
        <div
          className="absolute top-0 right-0 h-full bg-[#F4A261]/20 rounded-r-full"
          style={{ width: `${100 - highPercent}%` }}
        />

        {/* Low marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#E76F6F] rounded-full border-2 border-white shadow-md z-10"
          style={{ left: `calc(${lowPercent}% - 8px)` }}
        />
        {/* High marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#F4A261] rounded-full border-2 border-white shadow-md z-10"
          style={{ left: `calc(${highPercent}% - 8px)` }}
        />

        {/* Labels */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-[#4ECDC4]">
            {low} - {high} mg/dL
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-between text-xs text-[#6B7280]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#E76F6F]" />
          Low
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#4ECDC4]" />
          In Range
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#F4A261]" />
          High
        </span>
      </div>

      {/* Input controls */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
            Low Target (mg/dL)
          </label>
          <input
            type="number"
            value={low}
            onChange={(e) => handleLowChange(parseInt(e.target.value) || MIN)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/30 focus:border-[#8B7EC8]"
            min={MIN}
            max={high - 10}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
            High Target (mg/dL)
          </label>
          <input
            type="number"
            value={high}
            onChange={(e) => handleHighChange(parseInt(e.target.value) || MAX)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/30 focus:border-[#8B7EC8]"
            min={low + 10}
            max={MAX}
          />
        </div>
      </div>

      {/* Save */}
      <button
        onClick={() => saveRange(low, high)}
        disabled={saving}
        className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
          saved
            ? 'bg-[#4ECDC4] text-white'
            : 'bg-[#8B7EC8] text-white hover:bg-[#7A6DB7]'
        } disabled:opacity-50`}
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Target Range'}
      </button>
    </div>
  );
}
