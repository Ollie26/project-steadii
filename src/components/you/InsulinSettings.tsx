'use client';

import React, { useState, useEffect } from 'react';

interface InsulinConfig {
  insulinType: string;
  rapidName: string;
  longActingName: string;
  carbRatio: number | '';
  correctionFactor: number | '';
}

export default function InsulinSettings() {
  const [config, setConfig] = useState<InsulinConfig>({
    insulinType: '',
    rapidName: '',
    longActingName: '',
    carbRatio: '',
    correctionFactor: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setConfig({
            insulinType: data.insulinType || '',
            rapidName: data.rapidName || '',
            longActingName: data.longActingName || '',
            carbRatio: data.carbRatio || '',
            correctionFactor: data.correctionFactor || '',
          });
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      console.error('Failed to save insulin settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof InsulinConfig, value: string | number) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Insulin type */}
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Insulin Regimen
        </label>
        <select
          value={config.insulinType}
          onChange={(e) => updateField('insulinType', e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/30 focus:border-[#8B7EC8] appearance-none"
        >
          <option value="">Select regimen</option>
          <option value="mdi">Multiple Daily Injections (MDI)</option>
          <option value="pump">Insulin Pump</option>
          <option value="basal-only">Basal Only</option>
          <option value="none">No Insulin</option>
        </select>
      </div>

      {/* Rapid-acting name */}
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Rapid-Acting Insulin
        </label>
        <input
          type="text"
          value={config.rapidName}
          onChange={(e) => updateField('rapidName', e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/30 focus:border-[#8B7EC8]"
          placeholder="e.g., Humalog, Novolog, Fiasp"
        />
      </div>

      {/* Long-acting name */}
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Long-Acting Insulin
        </label>
        <input
          type="text"
          value={config.longActingName}
          onChange={(e) => updateField('longActingName', e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/30 focus:border-[#8B7EC8]"
          placeholder="e.g., Lantus, Tresiba, Levemir"
        />
      </div>

      {/* Carb ratio + Correction factor */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
            Carb Ratio (1:X)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#6B7280]">
              1 :
            </span>
            <input
              type="number"
              value={config.carbRatio}
              onChange={(e) =>
                updateField(
                  'carbRatio',
                  e.target.value ? parseInt(e.target.value) : ''
                )
              }
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/30 focus:border-[#8B7EC8]"
              placeholder="10"
              min={1}
              max={100}
            />
          </div>
          <p className="text-[10px] text-[#6B7280] mt-1">
            1 unit per X grams of carbs
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
            Correction Factor
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#6B7280]">
              1 :
            </span>
            <input
              type="number"
              value={config.correctionFactor}
              onChange={(e) =>
                updateField(
                  'correctionFactor',
                  e.target.value ? parseInt(e.target.value) : ''
                )
              }
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/30 focus:border-[#8B7EC8]"
              placeholder="50"
              min={1}
              max={200}
            />
          </div>
          <p className="text-[10px] text-[#6B7280] mt-1">
            1 unit drops BG by X mg/dL
          </p>
        </div>
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
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Insulin Settings'}
      </button>
    </div>
  );
}
