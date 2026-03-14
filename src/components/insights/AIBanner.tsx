'use client';

import React from 'react';
import Link from 'next/link';

interface AIBannerProps {
  show: boolean;
}

export default function AIBanner({ show }: AIBannerProps) {
  if (!show) return null;

  return (
    <div className="bg-[#8B7EC8]/5 border border-[#8B7EC8]/15 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-[#8B7EC8]/10 flex items-center justify-center shrink-0">
        <svg
          className="w-4 h-4 text-[#8B7EC8]"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 2a1 1 0 011 1v1.323l1.954.674a1 1 0 01.09 1.82L11 7.86V10a1 1 0 11-2 0V7.86L6.956 6.817a1 1 0 01.09-1.82L9 4.323V3a1 1 0 011-1zm-5 9a1 1 0 011 1v.586l.707-.293a1 1 0 01.828 1.818L6 14.818V16a1 1 0 11-2 0v-1.182l-1.535-.707a1 1 0 01.828-1.818L4 12.586V12a1 1 0 011-1zm10 0a1 1 0 011 1v.586l.707-.293a1 1 0 01.828 1.818L16 14.818V16a1 1 0 11-2 0v-1.182l-1.535-.707a1 1 0 01.828-1.818L14 12.586V12a1 1 0 011-1z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#1A1A2E]">
          <span className="font-medium">Basic insights active.</span>{' '}
          <span className="text-[#6B7280]">
            Enable AI in settings for deeper, personalized analysis.
          </span>
        </p>
      </div>
      <Link
        href="/you"
        className="shrink-0 text-xs font-medium text-[#8B7EC8] hover:underline"
      >
        Settings
      </Link>
    </div>
  );
}
