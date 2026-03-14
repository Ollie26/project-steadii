"use client";

import React from "react";

export interface WelcomeData {
  name: string;
  diabetesType: string;
  yearDiagnosed: string;
  lastA1C: string;
  lastA1CDate: string;
}

interface WelcomeStepProps {
  data: WelcomeData;
  onChange: (data: WelcomeData) => void;
}

const diabetesTypes = [
  { value: "type1", label: "Type 1", emoji: "💉" },
  { value: "type2", label: "Type 2", emoji: "💊" },
  { value: "gestational", label: "Gestational", emoji: "🤰" },
  { value: "other", label: "Other", emoji: "📋" },
];

export default function WelcomeStep({ data, onChange }: WelcomeStepProps) {
  const update = (field: keyof WelcomeData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold" style={{ color: "#1A1A2E" }}>
          Hey! Let&apos;s set up Steadii for you.
        </h1>
        <p className="text-lg" style={{ color: "#6B7280" }}>
          Just a few quick questions so we can personalize your experience.
        </p>
      </div>

      {/* Name input */}
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="block text-sm font-medium"
          style={{ color: "#1A1A2E" }}
        >
          What should we call you?
        </label>
        <input
          id="name"
          type="text"
          placeholder="Your first name"
          value={data.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full px-5 py-4 text-lg rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#8B7EC8] transition-all duration-300"
          style={{
            backgroundColor: "#F8F7F5",
            color: "#1A1A2E",
          }}
        />
      </div>

      {/* Diabetes type selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium" style={{ color: "#1A1A2E" }}>
          What type of diabetes do you have?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {diabetesTypes.map((type) => {
            const isSelected = data.diabetesType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => update("diabetesType", type.value)}
                className="relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: isSelected ? "#8B7EC8" : "#F8F7F5",
                  borderColor: isSelected ? "#8B7EC8" : "transparent",
                  color: isSelected ? "white" : "#1A1A2E",
                  boxShadow: isSelected
                    ? "0 4px 16px rgba(139, 126, 200, 0.3)"
                    : "none",
                }}
              >
                <span className="text-2xl">{type.emoji}</span>
                <span className="font-semibold">{type.label}</span>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="9" r="9" fill="white" fillOpacity="0.3" />
                      <path
                        d="M5.5 9L8 11.5L12.5 6.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Year diagnosed */}
      <div className="space-y-2">
        <label
          htmlFor="yearDiagnosed"
          className="block text-sm font-medium"
          style={{ color: "#1A1A2E" }}
        >
          Year diagnosed{" "}
          <span className="font-normal" style={{ color: "#6B7280" }}>
            (optional)
          </span>
        </label>
        <input
          id="yearDiagnosed"
          type="number"
          placeholder="e.g. 2018"
          value={data.yearDiagnosed}
          onChange={(e) => update("yearDiagnosed", e.target.value)}
          min={1920}
          max={new Date().getFullYear()}
          className="w-full px-5 py-4 rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#8B7EC8] transition-all duration-300"
          style={{
            backgroundColor: "#F8F7F5",
            color: "#1A1A2E",
          }}
        />
      </div>

      {/* Last A1C */}
      <div className="space-y-2">
        <label className="block text-sm font-medium" style={{ color: "#1A1A2E" }}>
          Last A1C value{" "}
          <span className="font-normal" style={{ color: "#6B7280" }}>
            (optional)
          </span>
        </label>
        <p className="text-xs" style={{ color: "#6B7280" }}>
          If you connect your CGM data, we can estimate this for you over time.
        </p>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="number"
              placeholder="e.g. 7.2"
              step="0.1"
              min={3}
              max={20}
              value={data.lastA1C}
              onChange={(e) => update("lastA1C", e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#8B7EC8] transition-all duration-300"
              style={{
                backgroundColor: "#F8F7F5",
                color: "#1A1A2E",
              }}
            />
          </div>
          <div className="flex-1">
            <input
              type="date"
              value={data.lastA1CDate}
              onChange={(e) => update("lastA1CDate", e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#8B7EC8] transition-all duration-300"
              style={{
                backgroundColor: "#F8F7F5",
                color: "#1A1A2E",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
