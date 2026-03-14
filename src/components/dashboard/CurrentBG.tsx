"use client";

import { useEffect, useState } from "react";

interface CurrentBGProps {
  value: number | null;
  trend: string | null;
  lastUpdated: Date | null;
  unit: string;
  targetLow: number;
  targetHigh: number;
}

const trendArrows: Record<string, string> = {
  rising_fast: "\u2191\u2191",
  rising: "\u2191",
  rising_slow: "\u2197",
  stable: "\u2192",
  falling_slow: "\u2198",
  falling: "\u2193",
  falling_fast: "\u2193\u2193",
};

function getMinutesAgo(date: Date | null): string {
  if (!date) return "";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
}

function getRangeStatus(
  value: number | null,
  low: number,
  high: number
): "low" | "in-range" | "high" | "none" {
  if (value === null) return "none";
  if (value < low) return "low";
  if (value > high) return "high";
  return "in-range";
}

const glowStyles = {
  "in-range":
    "bg-gradient-to-br from-[#4ECDC4]/10 via-[#4ECDC4]/5 to-transparent border-[#4ECDC4]/20",
  high: "bg-gradient-to-br from-[#F4A261]/10 via-[#F4A261]/5 to-transparent border-[#F4A261]/20",
  low: "bg-gradient-to-br from-[#E76F6F]/10 via-[#E76F6F]/5 to-transparent border-[#E76F6F]/20",
  none: "bg-gradient-to-br from-gray-100/50 via-gray-50/30 to-transparent border-gray-200/30",
};

const valueColors = {
  "in-range": "text-[#4ECDC4]",
  high: "text-[#F4A261]",
  low: "text-[#E76F6F]",
  none: "text-gray-400",
};

export default function CurrentBG({
  value,
  trend,
  lastUpdated,
  unit,
  targetLow,
  targetHigh,
}: CurrentBGProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setAnimate(true);
      const timeout = setTimeout(() => {
        setDisplayValue(value);
        setAnimate(false);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [value, displayValue]);

  const status = getRangeStatus(displayValue, targetLow, targetHigh);
  const trendArrow = trend ? trendArrows[trend] || "" : "";

  if (displayValue === null) {
    return (
      <div
        className={`relative rounded-2xl border p-8 text-center transition-all duration-500 ${glowStyles.none}`}
      >
        <div className="mb-2 text-2xl font-semibold text-[#1A1A2E]">
          No recent data
        </div>
        <p className="text-sm text-[#6B7280]">
          Connect your CGM or enter a reading
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-8 text-center transition-all duration-500 ${glowStyles[status]}`}
    >
      {/* Background glow pulse */}
      <div
        className={`absolute inset-0 rounded-2xl opacity-20 blur-3xl transition-colors duration-700 ${
          status === "in-range"
            ? "bg-[#4ECDC4]"
            : status === "high"
              ? "bg-[#F4A261]"
              : "bg-[#E76F6F]"
        }`}
      />

      <div className="relative z-10">
        {/* Glucose value + trend */}
        <div className="flex items-center justify-center gap-3">
          <span
            className={`font-mono text-6xl font-bold tracking-tight transition-all duration-300 ${
              animate ? "scale-95 opacity-60" : "scale-100 opacity-100"
            } ${valueColors[status]}`}
          >
            {displayValue}
          </span>
          {trendArrow && (
            <span
              className={`text-3xl transition-transform duration-500 ${valueColors[status]}`}
              style={{
                animation: "trendBounce 2s ease-in-out infinite",
              }}
            >
              {trendArrow}
            </span>
          )}
        </div>

        {/* Unit */}
        <div className="mt-1 text-sm font-medium text-[#6B7280]">{unit}</div>

        {/* Timestamp */}
        {lastUpdated && (
          <div className="mt-3 text-xs text-[#6B7280]">
            {getMinutesAgo(lastUpdated)}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes trendBounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
      `}</style>
    </div>
  );
}
