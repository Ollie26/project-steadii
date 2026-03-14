"use client";

interface TrendArrowProps {
  trend: string;
  size?: "sm" | "md" | "lg";
}

const trendConfig: Record<string, { rotation: number; color: string; label: string }> = {
  "rising_fast": { rotation: -60, color: "text-steadii-high-severe", label: "Rising fast" },
  "rising": { rotation: -30, color: "text-steadii-high", label: "Rising" },
  "rising_slow": { rotation: -15, color: "text-steadii-high", label: "Rising slowly" },
  "stable": { rotation: 0, color: "text-steadii-in-range", label: "Stable" },
  "falling_slow": { rotation: 15, color: "text-steadii-low", label: "Falling slowly" },
  "falling": { rotation: 30, color: "text-steadii-low", label: "Falling" },
  "falling_fast": { rotation: 60, color: "text-steadii-low-severe", label: "Falling fast" },
};

const sizeMap = {
  sm: { width: 14, height: 14 },
  md: { width: 18, height: 18 },
  lg: { width: 24, height: 24 },
};

export function TrendArrow({ trend, size = "md" }: TrendArrowProps) {
  const config = trendConfig[trend];
  if (!config) return null;

  const { width, height } = sizeMap[size];

  return (
    <span
      className={`inline-flex items-center justify-center ${config.color} animate-soft-pulse`}
      title={config.label}
      role="img"
      aria-label={config.label}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: `rotate(${config.rotation}deg)` }}
        className="transition-transform duration-300"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </span>
  );
}
