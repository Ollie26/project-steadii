"use client";

interface QuickStatsProps {
  stats: {
    tir: number;
    average: number;
    estimatedA1C: number;
    stdDev: number;
    highCount: number;
    lowCount: number;
    period: string;
  };
}

function getTirColor(tir: number): string {
  if (tir >= 70) return "text-[#4ECDC4]";
  if (tir >= 50) return "text-[#F4A261]";
  return "text-[#E76F6F]";
}

function getTirBgColor(tir: number): string {
  if (tir >= 70) return "bg-[#4ECDC4]/10";
  if (tir >= 50) return "bg-[#F4A261]/10";
  return "bg-[#E76F6F]/10";
}

interface StatCardProps {
  value: string;
  label: string;
  colorClass?: string;
  bgClass?: string;
  prominent?: boolean;
}

function StatCard({
  value,
  label,
  colorClass = "text-[#1A1A2E]",
  bgClass = "bg-white",
  prominent = false,
}: StatCardProps) {
  return (
    <div
      className={`flex-shrink-0 rounded-xl border border-gray-100 px-4 py-3 shadow-sm ${bgClass} ${
        prominent ? "min-w-[110px]" : "min-w-[100px]"
      }`}
    >
      <div
        className={`font-mono font-bold ${colorClass} ${
          prominent ? "text-2xl" : "text-xl"
        }`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-[#6B7280]">
        {label}
      </div>
    </div>
  );
}

export default function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="w-full">
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
        <StatCard
          value={`${stats.tir}%`}
          label="Time in Range"
          colorClass={getTirColor(stats.tir)}
          bgClass={getTirBgColor(stats.tir)}
          prominent
        />
        <StatCard
          value={`${stats.average}`}
          label="Avg mg/dL"
        />
        <StatCard
          value={`${stats.estimatedA1C.toFixed(1)}%`}
          label="Est. A1C"
        />
        <StatCard
          value={`${stats.stdDev}`}
          label="Std Dev"
        />
        <StatCard
          value={`${stats.highCount}`}
          label="Highs"
          colorClass="text-[#F4A261]"
        />
        <StatCard
          value={`${stats.lowCount}`}
          label="Lows"
          colorClass="text-[#E76F6F]"
        />
      </div>
      <p className="mt-1 text-right text-[10px] text-[#6B7280]">
        {stats.period}
      </p>
    </div>
  );
}
