"use client";

import React, { useState } from "react";

export interface InsulinData {
  deliveryMethod: string;
  rapidInsulin: string;
  rapidInsulinCustom: string;
  longInsulin: string;
  longInsulinCustom: string;
  carbRatio: string;
  correctionFactor: string;
  targetLow: string;
  targetHigh: string;
}

interface InsulinStepProps {
  data: InsulinData;
  onChange: (data: InsulinData) => void;
}

const deliveryMethods = [
  { value: "mdi", label: "MDI", desc: "Multiple Daily Injections", icon: "💉" },
  { value: "pump", label: "Pump", desc: "Insulin Pump", icon: "📟" },
  { value: "pen", label: "Pen", desc: "Insulin Pen", icon: "🖊️" },
];

const rapidOptions = ["Humalog", "Novolog", "Fiasp", "Other"];
const longOptions = ["Lantus", "Tresiba", "Levemir", "Other"];

export default function InsulinStep({ data, onChange }: InsulinStepProps) {
  const [showRapidDropdown, setShowRapidDropdown] = useState(false);
  const [showLongDropdown, setShowLongDropdown] = useState(false);

  const update = (field: keyof InsulinData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold" style={{ color: "#1A1A2E" }}>
          Your Insulin
        </h1>
        <p className="text-lg" style={{ color: "#6B7280" }}>
          Tell us how you manage your insulin so we can help you fine-tune.
        </p>
      </div>

      {/* Delivery method */}
      <div className="space-y-3">
        <label className="block text-sm font-medium" style={{ color: "#1A1A2E" }}>
          How do you take insulin?
        </label>
        <div className="grid grid-cols-3 gap-3">
          {deliveryMethods.map((method) => {
            const isSelected = data.deliveryMethod === method.value;
            return (
              <button
                key={method.value}
                type="button"
                onClick={() => update("deliveryMethod", method.value)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: isSelected ? "#8B7EC8" : "#F8F7F5",
                  borderColor: isSelected ? "#8B7EC8" : "transparent",
                  color: isSelected ? "white" : "#1A1A2E",
                  boxShadow: isSelected
                    ? "0 4px 16px rgba(139, 126, 200, 0.3)"
                    : "none",
                }}
              >
                <span className="text-2xl">{method.icon}</span>
                <span className="font-semibold text-sm">{method.label}</span>
                <span
                  className="text-xs"
                  style={{ color: isSelected ? "rgba(255,255,255,0.8)" : "#6B7280" }}
                >
                  {method.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rapid-acting insulin */}
      <div className="space-y-2">
        <label className="block text-sm font-medium" style={{ color: "#1A1A2E" }}>
          Rapid-acting insulin
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowRapidDropdown(!showRapidDropdown);
              setShowLongDropdown(false);
            }}
            className="w-full px-5 py-4 rounded-2xl border-2 border-transparent text-left flex items-center justify-between focus:outline-none focus:border-[#8B7EC8] transition-all duration-300"
            style={{ backgroundColor: "#F8F7F5", color: data.rapidInsulin ? "#1A1A2E" : "#6B7280" }}
          >
            <span>
              {data.rapidInsulin === "Other"
                ? data.rapidInsulinCustom || "Other (specify below)"
                : data.rapidInsulin || "Select insulin..."}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="transition-transform duration-200"
              style={{
                transform: showRapidDropdown ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="#6B7280"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {showRapidDropdown && (
            <div
              className="absolute z-10 w-full mt-2 rounded-2xl shadow-lg overflow-hidden border"
              style={{ backgroundColor: "white", borderColor: "#E5E7EB" }}
            >
              {rapidOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    update("rapidInsulin", option);
                    if (option !== "Other") {
                      update("rapidInsulinCustom", "");
                    }
                    setShowRapidDropdown(false);
                  }}
                  className="w-full px-5 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between"
                  style={{
                    color: "#1A1A2E",
                    backgroundColor:
                      data.rapidInsulin === option ? "#F0EEF8" : "transparent",
                  }}
                >
                  {option}
                  {data.rapidInsulin === option && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8L6.5 11.5L13 4.5"
                        stroke="#8B7EC8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {data.rapidInsulin === "Other" && (
          <input
            type="text"
            placeholder="Enter insulin name"
            value={data.rapidInsulinCustom}
            onChange={(e) => update("rapidInsulinCustom", e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#8B7EC8] transition-all duration-300 mt-2"
            style={{ backgroundColor: "#F8F7F5", color: "#1A1A2E" }}
          />
        )}
      </div>

      {/* Long-acting insulin */}
      <div className="space-y-2">
        <label className="block text-sm font-medium" style={{ color: "#1A1A2E" }}>
          Long-acting insulin
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowLongDropdown(!showLongDropdown);
              setShowRapidDropdown(false);
            }}
            className="w-full px-5 py-4 rounded-2xl border-2 border-transparent text-left flex items-center justify-between focus:outline-none focus:border-[#8B7EC8] transition-all duration-300"
            style={{ backgroundColor: "#F8F7F5", color: data.longInsulin ? "#1A1A2E" : "#6B7280" }}
          >
            <span>
              {data.longInsulin === "Other"
                ? data.longInsulinCustom || "Other (specify below)"
                : data.longInsulin || "Select insulin..."}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="transition-transform duration-200"
              style={{
                transform: showLongDropdown ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="#6B7280"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {showLongDropdown && (
            <div
              className="absolute z-10 w-full mt-2 rounded-2xl shadow-lg overflow-hidden border"
              style={{ backgroundColor: "white", borderColor: "#E5E7EB" }}
            >
              {longOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    update("longInsulin", option);
                    if (option !== "Other") {
                      update("longInsulinCustom", "");
                    }
                    setShowLongDropdown(false);
                  }}
                  className="w-full px-5 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between"
                  style={{
                    color: "#1A1A2E",
                    backgroundColor:
                      data.longInsulin === option ? "#F0EEF8" : "transparent",
                  }}
                >
                  {option}
                  {data.longInsulin === option && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8L6.5 11.5L13 4.5"
                        stroke="#8B7EC8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {data.longInsulin === "Other" && (
          <input
            type="text"
            placeholder="Enter insulin name"
            value={data.longInsulinCustom}
            onChange={(e) => update("longInsulinCustom", e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#8B7EC8] transition-all duration-300 mt-2"
            style={{ backgroundColor: "#F8F7F5", color: "#1A1A2E" }}
          />
        )}
      </div>

      {/* Carb Ratio */}
      <div className="space-y-2">
        <label className="block text-sm font-medium" style={{ color: "#1A1A2E" }}>
          Carb ratio (1 unit per X grams)
        </label>
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs"
          style={{ backgroundColor: "#F0EEF8", color: "#8B7EC8" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="#8B7EC8" strokeWidth="1.5" />
            <path
              d="M8 5V8.5M8 11H8.01"
              stroke="#8B7EC8"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          If you eat 60g of carbs and take 4 units, your ratio is 15:1
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color: "#6B7280" }}>
            1 :
          </span>
          <input
            type="number"
            placeholder="e.g. 15"
            min={1}
            max={100}
            value={data.carbRatio}
            onChange={(e) => update("carbRatio", e.target.value)}
            className="flex-1 px-5 py-4 rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#8B7EC8] transition-all duration-300"
            style={{ backgroundColor: "#F8F7F5", color: "#1A1A2E" }}
          />
          <span className="text-sm" style={{ color: "#6B7280" }}>
            grams
          </span>
        </div>
      </div>

      {/* Correction Factor */}
      <div className="space-y-2">
        <label className="block text-sm font-medium" style={{ color: "#1A1A2E" }}>
          Correction factor (mg/dL per 1 unit)
        </label>
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs"
          style={{ backgroundColor: "#F0EEF8", color: "#8B7EC8" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="#8B7EC8" strokeWidth="1.5" />
            <path
              d="M8 5V8.5M8 11H8.01"
              stroke="#8B7EC8"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          If 1 unit drops you about 50 mg/dL, enter 50
        </div>
        <input
          type="number"
          placeholder="e.g. 50"
          min={1}
          max={200}
          value={data.correctionFactor}
          onChange={(e) => update("correctionFactor", e.target.value)}
          className="w-full px-5 py-4 rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#8B7EC8] transition-all duration-300"
          style={{ backgroundColor: "#F8F7F5", color: "#1A1A2E" }}
        />
      </div>

      {/* Target Range */}
      <div className="space-y-3">
        <label className="block text-sm font-medium" style={{ color: "#1A1A2E" }}>
          Target blood sugar range (mg/dL)
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label
              className="block text-xs mb-1 font-medium"
              style={{ color: "#6B7280" }}
            >
              Low
            </label>
            <input
              type="number"
              placeholder="70"
              min={50}
              max={200}
              value={data.targetLow}
              onChange={(e) => update("targetLow", e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#8B7EC8] transition-all duration-300"
              style={{ backgroundColor: "#F8F7F5", color: "#1A1A2E" }}
            />
          </div>
          <span
            className="mt-5 text-lg font-medium"
            style={{ color: "#6B7280" }}
          >
            to
          </span>
          <div className="flex-1">
            <label
              className="block text-xs mb-1 font-medium"
              style={{ color: "#6B7280" }}
            >
              High
            </label>
            <input
              type="number"
              placeholder="180"
              min={100}
              max={400}
              value={data.targetHigh}
              onChange={(e) => update("targetHigh", e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#8B7EC8] transition-all duration-300"
              style={{ backgroundColor: "#F8F7F5", color: "#1A1A2E" }}
            />
          </div>
        </div>
        {/* Visual range indicator */}
        <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#F8F7F5" }}>
          <div
            className="absolute h-full rounded-full transition-all duration-500"
            style={{
              backgroundColor: "#8B7EC8",
              opacity: 0.3,
              left: `${Math.max(0, ((Number(data.targetLow) || 70) - 40) / 3.6)}%`,
              right: `${Math.max(0, 100 - ((Number(data.targetHigh) || 180) - 40) / 3.6)}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs" style={{ color: "#6B7280" }}>
          <span>40 mg/dL</span>
          <span>400 mg/dL</span>
        </div>
      </div>
    </div>
  );
}
