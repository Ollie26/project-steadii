"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import WelcomeStep, { type WelcomeData } from "@/components/onboarding/WelcomeStep";
import BodyStep, { type BodyData } from "@/components/onboarding/BodyStep";
import InsulinStep, { type InsulinData } from "@/components/onboarding/InsulinStep";
import PainPointsStep from "@/components/onboarding/PainPointsStep";
import ConnectStep from "@/components/onboarding/ConnectStep";

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Step 1 - Welcome
  const [welcomeData, setWelcomeData] = useState<WelcomeData>({
    name: "",
    diabetesType: "",
    yearDiagnosed: "",
    lastA1C: "",
    lastA1CDate: "",
  });

  // Step 2 - Body
  const [bodyData, setBodyData] = useState<BodyData>({
    age: "",
    heightFeet: "",
    heightInches: "",
    heightCm: "",
    heightUnit: "imperial",
    weight: "",
    weightUnit: "lbs",
    gender: "",
  });

  // Step 3 - Insulin
  const [insulinData, setInsulinData] = useState<InsulinData>({
    deliveryMethod: "",
    rapidInsulin: "",
    rapidInsulinCustom: "",
    longInsulin: "",
    longInsulinCustom: "",
    carbRatio: "",
    correctionFactor: "",
    targetLow: "70",
    targetHigh: "180",
  });

  // Step 4 - Pain Points
  const [painPoints, setPainPoints] = useState<string[]>([]);

  // Scroll to top when step changes
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const saveProfileData = useCallback(async () => {
    try {
      const profilePayload = {
        name: welcomeData.name || undefined,
        diabetesType: welcomeData.diabetesType || undefined,
        yearDiagnosed: welcomeData.yearDiagnosed
          ? parseInt(welcomeData.yearDiagnosed)
          : undefined,
        lastA1C: welcomeData.lastA1C
          ? parseFloat(welcomeData.lastA1C)
          : undefined,
        lastA1CDate: welcomeData.lastA1CDate || undefined,
        age: bodyData.age ? parseInt(bodyData.age) : undefined,
        heightFeet: bodyData.heightFeet
          ? parseInt(bodyData.heightFeet)
          : undefined,
        heightInches: bodyData.heightInches
          ? parseInt(bodyData.heightInches)
          : undefined,
        heightCm: bodyData.heightCm
          ? parseFloat(bodyData.heightCm)
          : undefined,
        heightUnit: bodyData.heightUnit,
        weight: bodyData.weight ? parseFloat(bodyData.weight) : undefined,
        weightUnit: bodyData.weightUnit,
        gender: bodyData.gender || undefined,
        insulinDeliveryMethod: insulinData.deliveryMethod || undefined,
        rapidInsulin:
          insulinData.rapidInsulin === "Other"
            ? insulinData.rapidInsulinCustom || undefined
            : insulinData.rapidInsulin || undefined,
        longInsulin:
          insulinData.longInsulin === "Other"
            ? insulinData.longInsulinCustom || undefined
            : insulinData.longInsulin || undefined,
        carbRatio: insulinData.carbRatio
          ? parseFloat(insulinData.carbRatio)
          : undefined,
        correctionFactor: insulinData.correctionFactor
          ? parseFloat(insulinData.correctionFactor)
          : undefined,
        targetLow: insulinData.targetLow
          ? parseInt(insulinData.targetLow)
          : undefined,
        targetHigh: insulinData.targetHigh
          ? parseInt(insulinData.targetHigh)
          : undefined,
      };

      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      });
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  }, [welcomeData, bodyData, insulinData]);

  const savePainPoints = useCallback(async () => {
    if (painPoints.length === 0) return;
    try {
      await fetch("/api/profile/pain-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ painPoints }),
      });
    } catch (err) {
      console.error("Failed to save pain points:", err);
    }
  }, [painPoints]);

  const completeOnboarding = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveProfileData();
      await savePainPoints();

      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingComplete: true }),
      });

      router.push("/");
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      // Still redirect even if save fails -- data can be re-entered
      router.push("/");
    } finally {
      setIsSaving(false);
    }
  }, [saveProfileData, savePainPoints, router]);

  const goToStep = useCallback(
    async (step: number) => {
      if (isAnimating || step < 1 || step > TOTAL_STEPS) return;

      setIsAnimating(true);
      setDirection(step > currentStep ? "forward" : "backward");

      // Save profile data on step transitions
      if (currentStep <= 3) {
        await saveProfileData();
      }
      if (currentStep === 4) {
        await savePainPoints();
      }

      // Brief delay for animation
      setTimeout(() => {
        setCurrentStep(step);
        setTimeout(() => setIsAnimating(false), 400);
      }, 200);
    },
    [currentStep, isAnimating, saveProfileData, savePainPoints]
  );

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, goToStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  const handleConnectComplete = useCallback(
    async () => {
      await completeOnboarding();
    },
    [completeOnboarding]
  );

  // Step-specific validation for enabling Next button
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return welcomeData.name.trim().length > 0;
      case 2:
        return true; // Body data is optional
      case 3:
        return true; // Insulin data is optional
      case 4:
        return true; // Pain points are optional but encouraged
      case 5:
        return true;
      default:
        return true;
    }
  }, [currentStep, welcomeData.name]);

  const getStepLabel = () => {
    switch (currentStep) {
      case 1:
        return "Welcome";
      case 2:
        return "About You";
      case 3:
        return "Insulin";
      case 4:
        return "Pain Points";
      case 5:
        return "Connect Data";
      default:
        return "";
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "white" }}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-lg mx-auto px-6 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium" style={{ color: "#6B7280" }}>
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <span className="text-xs font-semibold" style={{ color: "#8B7EC8" }}>
              {getStepLabel()}
            </span>
          </div>
          <OnboardingProgress
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
          />
        </div>
      </div>

      {/* Scrollable content area */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-8">
          {/* Animated step container */}
          <div
            className="transition-all duration-400 ease-out"
            style={{
              opacity: isAnimating ? 0 : 1,
              transform: isAnimating
                ? direction === "forward"
                  ? "translateX(40px)"
                  : "translateX(-40px)"
                : "translateX(0)",
              transition: "opacity 0.35s ease-out, transform 0.35s ease-out",
            }}
          >
            {currentStep === 1 && (
              <WelcomeStep data={welcomeData} onChange={setWelcomeData} />
            )}
            {currentStep === 2 && (
              <BodyStep data={bodyData} onChange={setBodyData} />
            )}
            {currentStep === 3 && (
              <InsulinStep data={insulinData} onChange={setInsulinData} />
            )}
            {currentStep === 4 && (
              <PainPointsStep
                selectedPoints={painPoints}
                onChange={setPainPoints}
              />
            )}
            {currentStep === 5 && (
              <ConnectStep onComplete={handleConnectComplete} />
            )}
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="sticky bottom-0 bg-white/80 backdrop-blur-lg border-t border-gray-100">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center gap-3">
          {/* Back button */}
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isAnimating}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 hover:bg-gray-100 disabled:opacity-40"
              style={{ color: "#6B7280" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M10 4L6 8L10 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back
            </button>
          )}

          <div className="flex-1" />

          {/* Next / Get Started */}
          {currentStep < TOTAL_STEPS && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || isAnimating}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#8B7EC8",
                boxShadow: canProceed()
                  ? "0 4px 16px rgba(139, 126, 200, 0.35)"
                  : "none",
              }}
            >
              {currentStep === 4 ? "Almost done" : "Next"}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 4L10 8L6 12"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {currentStep === TOTAL_STEPS && (
            <button
              type="button"
              onClick={completeOnboarding}
              disabled={isSaving || isAnimating}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: "#8B7EC8",
                boxShadow: "0 4px 16px rgba(139, 126, 200, 0.35)",
              }}
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="white"
                      strokeWidth="3"
                      strokeDasharray="31.4 31.4"
                      strokeLinecap="round"
                    />
                  </svg>
                  Setting up...
                </>
              ) : (
                <>
                  Get Started
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8H13M9 4L13 8L9 12"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Global animation styles */}
      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Hide number input spinners for a cleaner look */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
