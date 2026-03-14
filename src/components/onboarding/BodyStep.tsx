"use client";

import React from "react";

export interface BodyData {
  age: string;
  heightFeet: string;
  heightInches: string;
  heightCm: string;
  heightUnit: "imperial" | "metric";
  weight: string;
  weightUnit: "lbs" | "kg";
  gender: string;
}

interface BodyStepProps {
  data: BodyData;
  onChange: (data: BodyData) => void;
}

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export default function BodyStep({ data, onChange }: BodyStepProps) {
  const update = (field: keyof BodyData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold" style={{ color: "#1A1A2E" }}>
          About You
        </h1>
        <p className="text-lg" style={{ color: "#6B7280" }}>
          This helps us give you more accurate recommendations.
        </p>
      </div>

      {/* Age */}
      <div className="space-y-2">
        <label
          htmlFor="age"
          className="block text-sm font-medium"
          style={{ color: "#1A1A2E" }}
        >
          Age
        </label>
        <input
          id="age"
          type="number"
          placeholder="Your age"
          min={1}
          max={120}
          value={data.age}
          onChange={(e) => update("age", e.target.value)}
          className="w-full px-5 py-4 rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#8B7EC8] transition-all duration-300"
          style={{ backgroundColor: "#F8F7F5", color: "#1A1A2E" }}
        />
      </div>

      {/* Height */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium" style={{ color: "#1A1A2E" }}>
            Height
          </label>
          <button
            type="button"
            onClick={() =>
              update(
                "heightUnit",
                data.heightUnit === "imperial" ? "metric" : "imperial"
              )
            }
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300"
            style={{
              backgroundColor: "#F0EEF8",
              color: "#8B7EC8",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="transition-transform duration-300"
              style={{
                transform:
                  data.heightUnit === "metric" ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <path
                d="M5 3L9 7L5 11"
                stroke="#8B7EC8"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {data.heightUnit === "imperial" ? "Switch to cm" : "Switch to ft/in"}
          </button>
        </div>

        {data.heightUnit === "imperial" ? (
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="number"
                placeholder="Feet"
                min={1}
                max={8}
                value={data.heightFeet}
                onChange={(e) => update("heightFeet", e.target.value)}
                className="w-full px-5 py-4 pr-12 rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#8B7EC8] transition-all duration-300"
                style={{ backgroundColor: "#F8F7F5", color: "#1A1A2E" }}
              />
              <span
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: "#6B7280" }}
              >
                ft
              </span>
            </div>
            <div className="flex-1 relative">
              <input
                type="number"
                placeholder="Inches"
                min={0}
                max={11}
                value={data.heightInches}
                onChange={(e) => update("heightInches", e.target.value)}
                className="w-full px-5 py-4 pr-12 rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#8B7EC8] transition-all duration-300"
                style={{ backgroundColor: "#F8F7F5", color: "#1A1A2E" }}
              />
              <span
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: "#6B7280" }}
              >
                in
              </span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <input
              type="number"
              placeholder="Height in cm"
              min={50}
              max={250}
              value={data.heightCm}
              onChange={(e) => update("heightCm", e.target.value)}
              className="w-full px-5 py-4 pr-12 rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#8B7EC8] transition-all duration-300"
              style={{ backgroundColor: "#F8F7F5", color: "#1A1A2E" }}
            />
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "#6B7280" }}
            >
              cm
            </span>
          </div>
        )}
      </div>

      {/* Weight */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium" style={{ color: "#1A1A2E" }}>
            Weight
          </label>
          <button
            type="button"
            onClick={() =>
              update("weightUnit", data.weightUnit === "lbs" ? "kg" : "lbs")
            }
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300"
            style={{
              backgroundColor: "#F0EEF8",
              color: "#8B7EC8",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="transition-transform duration-300"
              style={{
                transform:
                  data.weightUnit === "kg" ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <path
                d="M5 3L9 7L5 11"
                stroke="#8B7EC8"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {data.weightUnit === "lbs" ? "Switch to kg" : "Switch to lbs"}
          </button>
        </div>
        <div className="relative">
          <input
            type="number"
            placeholder={`Weight in ${data.weightUnit}`}
            min={1}
            max={999}
            value={data.weight}
            onChange={(e) => update("weight", e.target.value)}
            className="w-full px-5 py-4 pr-12 rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#8B7EC8] transition-all duration-300"
            style={{ backgroundColor: "#F8F7F5", color: "#1A1A2E" }}
          />
          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: "#6B7280" }}
          >
            {data.weightUnit}
          </span>
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-3">
        <label className="block text-sm font-medium" style={{ color: "#1A1A2E" }}>
          Gender
        </label>
        <div className="grid grid-cols-2 gap-3">
          {genderOptions.map((option) => {
            const isSelected = data.gender === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => update("gender", option.value)}
                className="px-5 py-4 rounded-2xl border-2 font-semibold transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: isSelected ? "#8B7EC8" : "#F8F7F5",
                  borderColor: isSelected ? "#8B7EC8" : "transparent",
                  color: isSelected ? "white" : "#1A1A2E",
                  boxShadow: isSelected
                    ? "0 4px 16px rgba(139, 126, 200, 0.3)"
                    : "none",
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
