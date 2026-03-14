'use client';

import { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Insight {
  id: number;
  category: string;
  title: string;
  body: string;
  actionable: string | null;
  dataPoints: number | null;
  confidence: string | null;
  source: string;
  dismissed: boolean;
  createdAt: string;
}

interface UseInsightsReturn {
  insights: Insight[];
  loading: boolean;
  generating: boolean;
  error: string | null;
  generateInsights: () => Promise<void>;
  dismissInsight: (id: number) => Promise<void>;
  refetch: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useInsights(): UseInsightsReturn {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Fetch active insights ----------------------------------------------
  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/insights');

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error || `Failed to fetch insights (${res.status})`,
        );
      }

      const data: Insight[] = await res.json();
      setInsights(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch insights',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // ---- Generate new insights via AI / fallback ----------------------------
  const generateInsights = useCallback(async () => {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/insights/generate', {
        method: 'POST',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error || `Failed to generate insights (${res.status})`,
        );
      }

      const data: Insight[] = await res.json();
      setInsights(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate insights',
      );
    } finally {
      setGenerating(false);
    }
  }, []);

  // ---- Dismiss an insight -------------------------------------------------
  const dismissInsight = useCallback(async (id: number) => {
    setError(null);

    // Optimistic removal
    setInsights((prev) => prev.filter((i) => i.id !== id));

    try {
      const res = await fetch(`/api/insights/${id}/dismiss`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        // Revert on failure - refetch to get accurate state
        await fetchInsights();
        const body = await res.json().catch(() => ({}));
        const msg =
          body.error || `Failed to dismiss insight (${res.status})`;
        setError(msg);
        throw new Error(msg);
      }
    } catch (err) {
      if (err instanceof TypeError) {
        // Network error - revert
        await fetchInsights();
        setError('Network error dismissing insight');
      }
      throw err;
    }
  }, [fetchInsights]);

  return {
    insights,
    loading,
    generating,
    error,
    generateInsights,
    dismissInsight,
    refetch: fetchInsights,
  };
}
