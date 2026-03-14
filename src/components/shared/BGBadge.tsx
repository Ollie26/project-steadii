"use client";

import { TrendArrow } from "./TrendArrow";

interface BGBadgeProps {
  value: number;
  unit?: string;
  size?: "sm" | "md" | "lg";
  targetLow?: number;
  targetHigh?: number;
  trend?: string;
}

function getRangeColor(value: number, targetLow: number, targetHigh: number) {
  if (value >= targetLow && value <= targetHigh) {
    return {
      text: "text-steadii-in-range",
      bg: "bg-steadii-in-range/10",
      label: "In Range",
    };
  }
  if (value > targetHigh && value <= targetHigh + 50) {
    return {
      text: "text-steadii-high",
      bg: "bg-steadii-high/10",
      label: "High",
    };
  }
  if (value > targetHigh + 50) {
    return {
      text: "text-steadii-high-severe",
      bg: "bg-steadii-high-severe/10",
      label: "Very High",
    };
  }
  if (value < targetLow && value >= targetLow - 15) {
    return {
      text: "text-steadii-low",
      bg: "bg-steadii-low/10",
      label: "Low",
    };
  }
  return {
    text: "text-steadii-low-severe",
    bg: "bg-steadii-low-severe/10",
    label: "Very Low",
  };
}

const sizeClasses = {
  sm: {
    wrapper: "px-2 py-1 gap-1",
    value: "text-lg",
    unit: "text-[10px]",
  },
  md: {
    wrapper: "px-3 py-1.5 gap-1.5",
    value: "text-2xl",
    unit: "text-xs",
  },
  lg: {
    wrapper: "px-4 py-2 gap-2",
    value: "text-4xl",
    unit: "text-sm",
  },
};

export function BGBadge({
  value,
  unit = "mg/dL",
  size = "md",
  targetLow = 70,
  targetHigh = 180,
  trend,
}: BGBadgeProps) {
  const range = getRangeColor(value, targetLow, targetHigh);
  const s = sizeClasses[size];

  return (
    <div
      className={`
        inline-flex items-center rounded-steadii-md ${range.bg} ${s.wrapper}
      `}
    >
      <span className={`font-mono font-semibold ${range.text} ${s.value}`}>
        {value}
      </span>
      <span className={`text-steadii-text-tertiary ${s.unit} font-medium`}>
        {unit}
      </span>
      {trend && <TrendArrow trend={trend} size={size} />}
    </div>
  );
}
