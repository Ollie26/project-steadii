'use client';

import { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  name: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  gender: string | null;
  diabetesType: string | null;
  diagnosisYear: number | null;
  lastA1C: number | null;
  lastA1CDate: string | null;
  insulinType: string | null;
  rapidInsulinName: string | null;
  longActingName: string | null;
  carbRatio: number | null;
  correctionFactor: number | null;
  targetLow: number | null;
  targetHigh: number | null;
  glucoseUnit: string;
  weightUnit: string;
  heightUnit: string;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UpdateProfileData = Partial<
  Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>
>;

interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: UpdateProfileData) => Promise<UserProfile>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Fetch profile on mount ---------------------------------------------
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/profile');

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error || `Failed to fetch profile (${res.status})`,
        );
      }

      const data: UserProfile = await res.json();
      setProfile(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch profile',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ---- Update profile -----------------------------------------------------
  const updateProfile = useCallback(
    async (data: UpdateProfileData): Promise<UserProfile> => {
      setError(null);

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body.error || `Failed to update profile (${res.status})`;
        setError(msg);
        throw new Error(msg);
      }

      const updated: UserProfile = await res.json();
      setProfile(updated);
      return updated;
    },
    [],
  );

  return { profile, loading, error, updateProfile };
}
