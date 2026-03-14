'use client';

import React, { useState, useEffect } from 'react';

interface PainPoint {
  id: string;
  label: string;
  description?: string;
  active: boolean;
}

const defaultPainPoints: Omit<PainPoint, 'active'>[] = [
  { id: 'post-meal-spikes', label: 'Post-meal spikes', description: 'High glucose after eating' },
  { id: 'dawn-phenomenon', label: 'Dawn phenomenon', description: 'High fasting glucose in the morning' },
  { id: 'overnight-lows', label: 'Overnight lows', description: 'Low glucose while sleeping' },
  { id: 'exercise-lows', label: 'Exercise-related lows', description: 'Drops during or after activity' },
  { id: 'stress-highs', label: 'Stress-related highs', description: 'Elevated glucose from stress' },
  { id: 'inconsistent-meals', label: 'Inconsistent meal timing', description: 'Irregular eating patterns' },
  { id: 'carb-counting', label: 'Carb counting accuracy', description: 'Difficulty estimating carbs' },
  { id: 'sleep-impact', label: 'Sleep affecting glucose', description: 'Poor sleep worsening control' },
];

export default function PainPointManager() {
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPainPoints() {
      try {
        const res = await fetch('/api/profile/pain-points');
        if (res.ok) {
          const data = await res.json();
          const existing = data.painPoints || data || [];
          // Merge with defaults
          const merged = defaultPainPoints.map((dp) => {
            const found = existing.find((ep: PainPoint) => ep.id === dp.id);
            return found || { ...dp, active: false };
          });
          // Add any custom ones not in defaults
          existing.forEach((ep: PainPoint) => {
            if (!defaultPainPoints.find((dp) => dp.id === ep.id)) {
              merged.push(ep);
            }
          });
          setPainPoints(merged);
        } else {
          setPainPoints(
            defaultPainPoints.map((dp) => ({ ...dp, active: false }))
          );
        }
      } catch {
        setPainPoints(
          defaultPainPoints.map((dp) => ({ ...dp, active: false }))
        );
      } finally {
        setLoading(false);
      }
    }
    fetchPainPoints();
  }, []);

  const togglePainPoint = (id: string) => {
    setPainPoints((prev) =>
      prev.map((pp) => (pp.id === id ? { ...pp, active: !pp.active } : pp))
    );
  };

  const addCustom = () => {
    const label = customInput.trim();
    if (!label) return;
    const id = `custom-${Date.now()}`;
    setPainPoints((prev) => [...prev, { id, label, active: true }]);
    setCustomInput('');
  };

  const removePainPoint = (id: string) => {
    setPainPoints((prev) => prev.filter((pp) => pp.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/profile/pain-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ painPoints }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      console.error('Failed to save pain points');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  const activePPs = painPoints.filter((pp) => pp.active);

  return (
    <div className="space-y-4">
      {/* Active pain points */}
      {activePPs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#6B7280]">
            Active ({activePPs.length})
          </p>
          {activePPs.map((pp) => (
            <div
              key={pp.id}
              className="flex items-center gap-3 bg-[#8B7EC8]/5 border border-[#8B7EC8]/20 rounded-xl px-4 py-3"
            >
              <span className="w-2 h-2 rounded-full bg-[#8B7EC8] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1A2E]">
                  {pp.label}
                </p>
                {pp.description && (
                  <p className="text-xs text-[#6B7280]">{pp.description}</p>
                )}
              </div>
              <button
                onClick={() => togglePainPoint(pp.id)}
                className="text-xs text-[#8B7EC8] font-medium shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Available pain points */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[#6B7280]">Available</p>
        {painPoints
          .filter((pp) => !pp.active)
          .map((pp) => (
            <button
              key={pp.id}
              onClick={() => togglePainPoint(pp.id)}
              className="w-full flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors text-left"
            >
              <span className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0 flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#1A1A2E]">{pp.label}</p>
                {pp.description && (
                  <p className="text-xs text-[#6B7280]">{pp.description}</p>
                )}
              </div>
              {/* Show remove for custom items */}
              {pp.id.startsWith('custom-') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePainPoint(pp.id);
                  }}
                  className="text-xs text-[#E76F6F]"
                >
                  Delete
                </button>
              )}
            </button>
          ))}
      </div>

      {/* Add custom */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addCustom();
          }}
          placeholder="Add custom pain point..."
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/30 focus:border-[#8B7EC8]"
        />
        <button
          onClick={addCustom}
          disabled={!customInput.trim()}
          className="px-4 py-2.5 bg-gray-100 text-[#1A1A2E] rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
          saved
            ? 'bg-[#4ECDC4] text-white'
            : 'bg-[#8B7EC8] text-white hover:bg-[#7A6DB7]'
        } disabled:opacity-50`}
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Pain Points'}
      </button>
    </div>
  );
}
