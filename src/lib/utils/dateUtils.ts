import {
  format,
  formatDistanceToNowStrict,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isToday as fnsIsToday,
  isThisWeek as fnsIsThisWeek,
  differenceInMinutes,
  differenceInHours,
  differenceInSeconds,
  getHours,
} from "date-fns";

import type { DateRange, MealType, TimeOfDay } from "@/types";

// --- Formatting ---

/** Format a Date to a short time string, e.g. "3:45 PM" */
export function formatTime(date: Date): string {
  return format(date, "h:mm a");
}

/** Format a Date to a readable date string, e.g. "Mar 14, 2026" */
export function formatDate(date: Date): string {
  return format(date, "MMM d, yyyy");
}

/** Format a Date to date + time, e.g. "Mar 14, 2026 3:45 PM" */
export function formatDateTime(date: Date): string {
  return format(date, "MMM d, yyyy h:mm a");
}

// --- Time-of-day helpers ---

/** Determine the general time of day for a given Date. */
export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = getHours(date);
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/**
 * Auto-select a meal type based on the current hour.
 *   breakfast  5–10
 *   lunch     10–14
 *   dinner    16–20
 *   snack     otherwise
 */
export function getMealTypeForTime(date: Date = new Date()): MealType {
  const hour = getHours(date);
  if (hour >= 5 && hour < 10) return "breakfast";
  if (hour >= 10 && hour < 14) return "lunch";
  if (hour >= 16 && hour < 20) return "dinner";
  return "snack";
}

// --- Date ranges ---

export type DateRangePreset = "today" | "thisWeek" | "thisMonth" | "custom";

/**
 * Return a { start, end } DateRange for a given preset.
 * For "custom", pass explicit start/end dates.
 */
export function getDateRange(
  preset: DateRangePreset,
  customStart?: Date,
  customEnd?: Date,
): DateRange {
  const now = new Date();

  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "thisWeek":
      return {
        start: startOfWeek(now, { weekStartsOn: 0 }),
        end: endOfWeek(now, { weekStartsOn: 0 }),
      };
    case "thisMonth":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "custom":
      if (!customStart || !customEnd) {
        throw new Error(
          "customStart and customEnd are required for 'custom' preset",
        );
      }
      return { start: startOfDay(customStart), end: endOfDay(customEnd) };
  }
}

// --- Boolean helpers ---

/** Check whether a date falls on today. */
export function isToday(date: Date): boolean {
  return fnsIsToday(date);
}

/** Check whether a date falls within the current week (Sun–Sat). */
export function isThisWeek(date: Date): boolean {
  return fnsIsThisWeek(date, { weekStartsOn: 0 });
}

// --- Relative time ---

/**
 * Human-friendly relative time string.
 * e.g. "2 min ago", "1 hour ago", "3 days ago"
 */
export function timeAgo(date: Date): string {
  const now = new Date();
  const secDiff = differenceInSeconds(now, date);

  if (secDiff < 60) {
    return secDiff <= 1 ? "just now" : `${secDiff} sec ago`;
  }

  const minDiff = differenceInMinutes(now, date);
  if (minDiff < 60) {
    return minDiff === 1 ? "1 min ago" : `${minDiff} min ago`;
  }

  const hourDiff = differenceInHours(now, date);
  if (hourDiff < 24) {
    return hourDiff === 1 ? "1 hour ago" : `${hourDiff} hours ago`;
  }

  // Fall back to date-fns strict distance for larger spans
  return `${formatDistanceToNowStrict(date)} ago`;
}
