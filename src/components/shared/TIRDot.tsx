"use client";

interface TIRDotProps {
  color: "green" | "amber" | "red";
  size?: "sm" | "md";
}

const colorMap = {
  green: "bg-steadii-in-range",
  amber: "bg-steadii-high",
  red: "bg-steadii-low",
};

const sizeMap = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
};

export function TIRDot({ color, size = "md" }: TIRDotProps) {
  return (
    <span
      className={`
        inline-block rounded-full
        ${colorMap[color]}
        ${sizeMap[size]}
        animate-soft-pulse
      `}
      role="img"
      aria-label={`${color} status indicator`}
    />
  );
}
