"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  ReferenceDot,
} from "recharts";

interface Reading {
  timestamp: string;
  value: number;
}

interface MealMarker {
  timestamp: string;
  name: string;
  tirColor: string;
}

interface GlucoseChartProps {
  readings: Reading[];
  targetLow: number;
  targetHigh: number;
  meals?: MealMarker[];
  timeRange: string;
}

const TIME_RANGES = ["3h", "6h", "12h", "24h", "3d", "7d"] as const;

const rangeToMs: Record<string, number> = {
  "3h": 3 * 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "3d": 3 * 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

function formatTimeLabel(timestamp: string, range: string): string {
  const date = new Date(timestamp);
  if (range === "3d" || range === "7d") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { timestamp: string; value: number; mealName?: string } }>;
}

function CustomChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const time = new Date(data.timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs text-[#6B7280]">{time}</p>
      <p className="font-mono text-lg font-bold text-[#1A1A2E]">
        {data.value} <span className="text-xs font-normal text-[#6B7280]">mg/dL</span>
      </p>
      {data.mealName && (
        <p className="mt-1 text-xs text-[#8B7EC8]">{data.mealName}</p>
      )}
    </div>
  );
}

export default function GlucoseChart({
  readings,
  targetLow,
  targetHigh,
  meals = [],
  timeRange: initialRange,
}: GlucoseChartProps) {
  const [selectedRange, setSelectedRange] = useState(initialRange || "6h");

  const filteredData = useMemo(() => {
    const now = Date.now();
    const cutoff = now - (rangeToMs[selectedRange] || rangeToMs["6h"]);
    return readings
      .filter((r) => new Date(r.timestamp).getTime() >= cutoff)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      .map((r) => {
        const nearMeal = meals.find((m) => {
          const mealTime = new Date(m.timestamp).getTime();
          const readingTime = new Date(r.timestamp).getTime();
          return Math.abs(mealTime - readingTime) < 5 * 60 * 1000;
        });
        return {
          ...r,
          ts: new Date(r.timestamp).getTime(),
          mealName: nearMeal?.name,
        };
      });
  }, [readings, selectedRange, meals]);

  const filteredMeals = useMemo(() => {
    const now = Date.now();
    const cutoff = now - (rangeToMs[selectedRange] || rangeToMs["6h"]);
    return meals.filter((m) => new Date(m.timestamp).getTime() >= cutoff);
  }, [meals, selectedRange]);

  const yDomain = useMemo(() => {
    if (filteredData.length === 0) return [40, 300];
    const values = filteredData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return [Math.max(40, Math.floor(min / 10) * 10 - 10), Math.min(400, Math.ceil(max / 10) * 10 + 20)];
  }, [filteredData]);

  const referenceLines = [70, 120, 180, 250].filter(
    (v) => v >= yDomain[0] && v <= yDomain[1]
  );

  // Find the closest reading value for each meal marker
  const mealDots = useMemo(() => {
    return filteredMeals.map((meal) => {
      const mealTime = new Date(meal.timestamp).getTime();
      let closest = filteredData[0];
      let minDiff = Infinity;
      for (const d of filteredData) {
        const diff = Math.abs(d.ts - mealTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = d;
        }
      }
      return {
        ...meal,
        ts: mealTime,
        value: closest?.value ?? targetLow + (targetHigh - targetLow) / 2,
        fillColor:
          meal.tirColor === "green"
            ? "#4ECDC4"
            : meal.tirColor === "amber"
              ? "#F4A261"
              : meal.tirColor === "red"
                ? "#E76F6F"
                : "#8B7EC8",
      };
    });
  }, [filteredMeals, filteredData, targetLow, targetHigh]);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      {/* Time range selector */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#1A1A2E]">Glucose</h3>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                selectedRange === range
                  ? "bg-white text-[#1A1A2E] shadow-sm"
                  : "text-[#6B7280] hover:text-[#1A1A2E]"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {filteredData.length === 0 ? (
        <div className="flex h-[250px] items-center justify-center text-sm text-[#6B7280]">
          No readings in this time range
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={filteredData}
            margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
          >
            {/* Target range band */}
            <ReferenceArea
              y1={targetLow}
              y2={targetHigh}
              fill="#4ECDC4"
              fillOpacity={0.08}
              stroke="none"
            />

            {/* Reference lines */}
            {referenceLines.map((val) => (
              <ReferenceLine
                key={val}
                y={val}
                stroke="#E5E7EB"
                strokeDasharray="4 4"
                strokeWidth={0.5}
              />
            ))}

            <XAxis
              dataKey="ts"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(ts) =>
                formatTimeLabel(new Date(ts).toISOString(), selectedRange)
              }
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              minTickGap={50}
            />

            <YAxis
              domain={yDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#D1D5DB" }}
              width={35}
            />

            <Tooltip
              content={<CustomChartTooltip />}
              cursor={{ stroke: "#E5E7EB", strokeWidth: 1 }}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#4ECDC4"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 5,
                fill: "#4ECDC4",
                stroke: "#fff",
                strokeWidth: 2,
              }}
              connectNulls
            />

            {/* Meal markers */}
            {mealDots.map((meal, i) => (
              <ReferenceDot
                key={`meal-${i}`}
                x={meal.ts}
                y={meal.value}
                r={6}
                fill={meal.fillColor}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
