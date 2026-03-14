'use client';

import React, { useState, useCallback, useRef } from 'react';

interface UploadResult {
  success: boolean;
  count?: number;
  dateRange?: { start: string; end: string };
  error?: string;
}

export default function CSVUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setResult({ success: false, error: 'Please upload a .csv file' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setResult({
        success: false,
        error: 'File is too large. Maximum size is 10MB.',
      });
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const content = await file.text();

      const res = await fetch('/api/glucose/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, filename: file.name }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult({
          success: true,
          count: data.count || data.imported || 0,
          dateRange: data.dateRange,
        });
      } else {
        const data = await res.json().catch(() => ({}));
        setResult({
          success: false,
          error: data.error || 'Upload failed. Please check the file format.',
        });
      }
    } catch {
      setResult({
        success: false,
        error: 'Upload failed. Please check your connection and try again.',
      });
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-[#8B7EC8] bg-[#8B7EC8]/5'
            : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <svg
              className="w-8 h-8 text-[#8B7EC8] animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-sm text-[#6B7280]">Uploading and processing...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg
              className={`w-8 h-8 ${
                isDragOver ? 'text-[#8B7EC8]' : 'text-gray-400'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm font-medium text-[#1A1A2E]">
              {isDragOver ? 'Drop your CSV here' : 'Drop CSV or tap to upload'}
            </p>
            <p className="text-xs text-[#6B7280]">
              Supports Dexcom, Libre, and generic CSV formats
            </p>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            result.success
              ? 'bg-[#4ECDC4]/10 border border-[#4ECDC4]/20 text-[#1A1A2E]'
              : 'bg-[#E76F6F]/10 border border-[#E76F6F]/20 text-[#E76F6F]'
          }`}
        >
          {result.success ? (
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-[#4ECDC4] shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p>
                Imported <strong>{result.count}</strong> readings
                {result.dateRange && (
                  <> from {new Date(result.dateRange.start).toLocaleDateString()} to{' '}
                  {new Date(result.dateRange.end).toLocaleDateString()}</>
                )}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <p>{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
