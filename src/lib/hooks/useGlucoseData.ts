'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface GlucoseReading {
  id: number;
  timestamp: string;
  value: number;
  trend: string | null;
  source: string;
  createdAt: string;
}

interface UseGlucoseDataOptions {
  /** ISO date string for range start (inclusive) */
  startDate?: string;
  /** ISO date string for range end (inclusive) */
  endDate?: string;
  /** Auto-fetch on mount and when options change. Default true. */
  autoFetch?: boolean;
}

interface UseGlucoseDataReturn {
  readings: GlucoseReading[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Simple in-memory cache keyed by query string
const cache = new Map<string, { data: GlucoseReading[]; timestamp: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute

function buildCacheKey(startDate?: string, endDate?: string): string {
  return `glucose:${startDate ?? ''}:${endDate ?? ''}`;
}

export function useGlucoseData(
  options: UseGlucoseDataOptions = {},
): UseGlucoseDataReturn {
  const { startDate, endDate, autoFetch = true } = options;

  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the latest request to avoid stale updates
  const requestIdRef = useRef(0);

  const fetchReadings = useCallback(async () => {
    const cacheKey = buildCacheKey(startDate, endDate);

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setReadings(cached.data);
      setError(null);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const queryString = params.toString();
      const url = `/api/glucose${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body.error || `Failed to fetch glucose data (${response.status})`,
        );
      }

      const data: GlucoseReading[] = await response.json();

      // Only update state if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setReadings(data);
        cache.set(cacheKey, { data, timestamp: Date.now() });
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch glucose data',
        );
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (autoFetch) {
      fetchReadings();
    }
  }, [autoFetch, fetchReadings]);

  return { readings, loading, error, refetch: fetchReadings };
}
