"use client";

import React from "react";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function OnboardingProgress({
  currentStep,
  totalSteps,
}: OnboardingProgressProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-6">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;
        const isUpcoming = step > currentStep;

        return (
          <React.Fragment key={step}>
            {/* Connector line */}
            {i > 0 && (
              <div
                className="h-[2px] w-8 transition-colors duration-500 ease-out"
                style={{
                  backgroundColor: step <= currentStep ? "#8B7EC8" : "#D1D5DB",
                }}
              />
            )}
            {/* Step pill */}
            <div
              className="relative flex items-center justify-center transition-all duration-500 ease-out"
              style={{
                width: isActive ? 40 : 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: isCompleted
                  ? "#8B7EC8"
                  : isActive
                  ? "#8B7EC8"
                  : "transparent",
                border: isUpcoming ? "2px solid #D1D5DB" : "2px solid #8B7EC8",
                boxShadow: isActive ? "0 0 12px rgba(139, 126, 200, 0.4)" : "none",
              }}
            >
              {isCompleted && (
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  fill="none"
                  className="animate-[fadeIn_0.3s_ease-out]"
                >
                  <path
                    d="M1.5 4L3.2 5.7L6.5 2.3"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
