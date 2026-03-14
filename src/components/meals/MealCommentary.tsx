'use client';

import React, { useEffect, useState } from 'react';

interface MealCommentaryProps {
  mealId: string;
}

interface CommentaryResponse {
  commentary: string;
  enabled: boolean;
}

export default function MealCommentary({ mealId }: MealCommentaryProps) {
  const [commentary, setCommentary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchCommentary() {
      try {
        setLoading(true);
        setError(false);

        // Check if AI is enabled
        const profileRes = await fetch('/api/profile');
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (profile.aiEnabled === false) {
            setAiEnabled(false);
            setLoading(false);
            return;
          }
        }

        const res = await fetch(`/api/ai/meal-commentary?mealId=${mealId}`);
        if (!cancelled) {
          if (res.ok) {
            const data: CommentaryResponse = await res.json();
            if (data.enabled === false) {
              setAiEnabled(false);
            } else {
              setCommentary(data.commentary);
            }
          } else {
            setError(true);
          }
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCommentary();
    return () => {
      cancelled = true;
    };
  }, [mealId]);

  if (!aiEnabled) return null;

  if (loading) {
    return (
      <div className="bg-[#8B7EC8]/5 border border-[#8B7EC8]/15 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-[#8B7EC8]/20 animate-pulse" />
          <div className="h-4 w-32 bg-[#8B7EC8]/10 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-[#8B7EC8]/10 rounded animate-pulse" />
          <div className="h-3 w-4/5 bg-[#8B7EC8]/10 rounded animate-pulse" />
          <div className="h-3 w-3/5 bg-[#8B7EC8]/10 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !commentary) return null;

  return (
    <div className="bg-[#8B7EC8]/5 border border-[#8B7EC8]/15 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {/* AI sparkle icon */}
        <svg
          className="w-4 h-4 text-[#8B7EC8]"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 2a1 1 0 011 1v1.323l1.954.674a1 1 0 01.09 1.82L11 7.86V10a1 1 0 11-2 0V7.86L6.956 6.817a1 1 0 01.09-1.82L9 4.323V3a1 1 0 011-1zm-5 9a1 1 0 011 1v.586l.707-.293a1 1 0 01.828 1.818L6 14.818V16a1 1 0 11-2 0v-1.182l-1.535-.707a1 1 0 01.828-1.818L4 12.586V12a1 1 0 011-1zm10 0a1 1 0 011 1v.586l.707-.293a1 1 0 01.828 1.818L16 14.818V16a1 1 0 11-2 0v-1.182l-1.535-.707a1 1 0 01.828-1.818L14 12.586V12a1 1 0 011-1z" />
        </svg>
        <span className="text-xs font-semibold text-[#8B7EC8] uppercase tracking-wide">
          Steadii AI
        </span>
      </div>
      <p className="text-sm text-[#1A1A2E] leading-relaxed">{commentary}</p>
    </div>
  );
}
