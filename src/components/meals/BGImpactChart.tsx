'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  Dot,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface BGReading {
  timestamp: string;
  value: number;
}

interface BGImpactChartProps {
  readings: BGReading[];
  targetLow: number;
  targetHigh: number;
  mealTimestamp: string;
  height?: number;
}

export default function BGImpactChart({
  readings,
  targetLow,
  targetHigh,
  mealTimestamp,
  height = 300,
}: BGImpactChartProps) {
  if (!readings || readings.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-xl text-sm text-[#6B7280]"
        style={{ height }}
      >
        No glucose data available for this meal
      </div>
    );
  }

  const mealTime = new Date(mealTimestamp).getTime();

  const chartData = readings
    .map((r) => ({
      time: new Date(r.timestamp).getTime(),
      value: r.value,
      label: new Date(r.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }))
    .sort((a, b) => a.time - b.time);

  // Find peak value
  const peak = chartData.reduce(
    (max, d) => (d.value > max.value ? d : max),
    chartData[0]
  );

  // Find pre-meal BG (closest reading before meal)
  const preMealReading = chartData
    .filter((d) => d.time <= mealTime)
    .sort((a, b) => b.time - a.time)[0];

  const preMealBG = preMealReading?.value;

  const minValue = Math.min(
    ...chartData.map((d) => d.value),
    targetLow - 10
  );
  const maxValue = Math.max(
    ...chartData.map((d) => d.value),
    targetHigh + 10
  );

  const mealTimeLabel = new Date(mealTimestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Custom dot to mark peak
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.time === peak.time) {
      return (
        <Dot
          key="peak-dot"
          cx={cx}
          cy={cy}
          r={5}
          fill="#E76F6F"
          stroke="#fff"
          strokeWidth={2}
        />
      );
    }
    return <React.Fragment key={`dot-${payload.time}`} />;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B7EC8" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#8B7EC8" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f0f0f0"
            vertical={false}
          />

          {/* Target range band */}
          <ReferenceArea
            y1={targetLow}
            y2={targetHigh}
            fill="#4ECDC4"
            fillOpacity={0.08}
            stroke="none"
          />

          {/* Target lines */}
          <ReferenceLine
            y={targetLow}
            stroke="#4ECDC4"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />
          <ReferenceLine
            y={targetHigh}
            stroke="#4ECDC4"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />

          {/* Meal time vertical line */}
          <ReferenceLine
            x={mealTime}
            stroke="#8B7EC8"
            strokeDasharray="4 4"
            strokeWidth={2}
            label={{
              value: `Meal ${mealTimeLabel}`,
              position: 'top',
              fill: '#8B7EC8',
              fontSize: 11,
            }}
          />

          {/* Pre-meal BG reference */}
          {preMealBG && (
            <ReferenceLine
              y={preMealBG}
              stroke="#6B7280"
              strokeDasharray="2 2"
              strokeOpacity={0.4}
            />
          )}

          <XAxis
            dataKey="time"
            tickFormatter={(t) =>
              new Date(t).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            }
            tick={{ fontSize: 10, fill: '#6B7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            minTickGap={40}
          />

          <YAxis
            domain={[minValue, maxValue]}
            tick={{ fontSize: 10, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white shadow-lg rounded-lg px-3 py-2 border border-gray-100">
                    <p className="text-xs text-[#6B7280]">{data.label}</p>
                    <p className="text-sm font-semibold text-[#1A1A2E]">
                      {data.value} mg/dL
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#8B7EC8"
            strokeWidth={2}
            fill="url(#bgGradient)"
            dot={renderDot}
            activeDot={{ r: 4, fill: '#8B7EC8', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
