'use client';

import React, { useState } from 'react';

interface Filters {
  mealType: string;
  tirColor: string;
  dateRange: string;
  search: string;
}

interface MealFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const mealTypes = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];
const tirColors = ['All', 'Green', 'Amber', 'Red'];
const dateRanges = ['Today', 'This Week', 'This Month', 'Custom'];

const tirDotColors: Record<string, string> = {
  Green: '#4ECDC4',
  Amber: '#F4A261',
  Red: '#E76F6F',
};

export default function MealFilters({ filters, onChange }: MealFiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const updateFilter = (key: keyof Filters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const Pill = ({
    label,
    active,
    onClick,
    dot,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
    dot?: string;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-[#8B7EC8] text-white'
          : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
      }`}
    >
      {dot && (
        <span
          className="w-2 h-2 rounded-full inline-block"
          style={{ backgroundColor: active ? '#fff' : dot }}
        />
      )}
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search by food name..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/30 focus:border-[#8B7EC8]"
        />
      </div>

      {/* Meal type pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {mealTypes.map((type) => (
          <Pill
            key={type}
            label={type}
            active={filters.mealType === type.toLowerCase() || (type === 'All' && !filters.mealType)}
            onClick={() =>
              updateFilter('mealType', type === 'All' ? '' : type.toLowerCase())
            }
          />
        ))}
      </div>

      {/* TIR color pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tirColors.map((color) => (
          <Pill
            key={color}
            label={color}
            active={filters.tirColor === color.toLowerCase() || (color === 'All' && !filters.tirColor)}
            onClick={() =>
              updateFilter('tirColor', color === 'All' ? '' : color.toLowerCase())
            }
            dot={tirDotColors[color]}
          />
        ))}
      </div>

      {/* Date range pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {dateRanges.map((range) => (
          <Pill
            key={range}
            label={range}
            active={
              filters.dateRange === range.toLowerCase().replace(' ', '_') ||
              (range === 'Today' && !filters.dateRange)
            }
            onClick={() => {
              if (range === 'Custom') {
                setShowDatePicker(true);
                updateFilter('dateRange', 'custom');
              } else {
                setShowDatePicker(false);
                updateFilter(
                  'dateRange',
                  range.toLowerCase().replace(' ', '_')
                );
              }
            }}
          />
        ))}
      </div>

      {/* Custom date picker */}
      {showDatePicker && (
        <div className="flex gap-2">
          <input
            type="date"
            className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/30"
            onChange={(e) => updateFilter('dateRange', `custom_${e.target.value}`)}
          />
        </div>
      )}
    </div>
  );
}
