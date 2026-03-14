'use client';

import React, { useState } from 'react';

export default function DataExport() {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setExported(false);

    try {
      // Fetch all data
      const [glucoseRes, mealsRes, lifestyleRes] = await Promise.allSettled([
        fetch('/api/glucose/readings?limit=10000'),
        fetch('/api/meals?limit=10000'),
        fetch('/api/lifestyle?limit=10000'),
      ]);

      const rows: string[] = [];

      // Glucose readings
      rows.push('--- GLUCOSE READINGS ---');
      rows.push('Timestamp,Value (mg/dL),Source');
      if (glucoseRes.status === 'fulfilled' && glucoseRes.value.ok) {
        const data = await glucoseRes.value.json();
        const readings = data.readings || data || [];
        readings.forEach(
          (r: { timestamp: string; value: number; source?: string }) => {
            rows.push(
              `${r.timestamp},${r.value},${r.source || 'unknown'}`
            );
          }
        );
      }

      rows.push('');
      rows.push('--- MEALS ---');
      rows.push(
        'Timestamp,Name,Type,Carbs (g),Protein (g),Fat (g),Calories,TIR Color'
      );
      if (mealsRes.status === 'fulfilled' && mealsRes.value.ok) {
        const data = await mealsRes.value.json();
        const meals = data.meals || data || [];
        meals.forEach(
          (m: {
            timestamp: string;
            name: string;
            mealType: string;
            carbsGrams: number;
            proteinGrams?: number;
            fatGrams?: number;
            calories?: number;
            tirColor: string;
          }) => {
            rows.push(
              `${m.timestamp},"${m.name}",${m.mealType},${m.carbsGrams},${
                m.proteinGrams || ''
              },${m.fatGrams || ''},${m.calories || ''},${m.tirColor}`
            );
          }
        );
      }

      rows.push('');
      rows.push('--- LIFESTYLE LOGS ---');
      rows.push('Timestamp,Type,Value,Notes');
      if (lifestyleRes.status === 'fulfilled' && lifestyleRes.value.ok) {
        const data = await lifestyleRes.value.json();
        const logs = data.logs || data || [];
        logs.forEach(
          (l: {
            timestamp: string;
            type: string;
            value?: string;
            notes?: string;
          }) => {
            rows.push(
              `${l.timestamp},${l.type},${l.value || ''},"${
                l.notes || ''
              }"`
            );
          }
        );
      }

      // Create and download CSV
      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `steadii-export-${
        new Date().toISOString().split('T')[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch {
      console.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#6B7280]">
        Export all your glucose readings, meals, and lifestyle logs as a CSV
        file.
      </p>

      <button
        onClick={handleExport}
        disabled={exporting}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${
          exported
            ? 'bg-[#4ECDC4] text-white'
            : 'bg-white border border-gray-200 text-[#1A1A2E] hover:bg-gray-50'
        } disabled:opacity-50`}
      >
        {exporting ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Exporting...
          </>
        ) : exported ? (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Downloaded!
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export All Data
          </>
        )}
      </button>
    </div>
  );
}
