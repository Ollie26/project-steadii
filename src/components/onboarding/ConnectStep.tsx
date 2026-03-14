"use client";

import React, { useState, useCallback } from "react";

interface ConnectStepProps {
  onComplete: (method: "dexcom" | "csv" | "skip", data?: unknown) => void;
}

interface UploadPreview {
  count: number;
  startDate: string;
  endDate: string;
}

export default function ConnectStep({ onComplete }: ConnectStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<
    "dexcom" | "csv" | "skip" | null
  >(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<UploadPreview | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const parseCSV = useCallback(async (file: File) => {
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    // Try to find a header row with timestamp/glucose-like columns
    let headerIndex = -1;
    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      const lower = lines[i].toLowerCase();
      if (
        lower.includes("timestamp") ||
        lower.includes("glucose") ||
        lower.includes("date") ||
        lower.includes("egv")
      ) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      throw new Error(
        "Could not find a header row with timestamp or glucose columns. Make sure this is a Dexcom Clarity CSV export."
      );
    }

    const headers = lines[headerIndex]
      .split(",")
      .map((h) => h.trim().replace(/"/g, "").toLowerCase());

    // Find relevant column indices
    const timestampCol = headers.findIndex(
      (h) =>
        h.includes("timestamp") ||
        h.includes("date") ||
        h.includes("display time")
    );
    const glucoseCol = headers.findIndex(
      (h) =>
        h.includes("glucose") ||
        h.includes("value") ||
        h.includes("egv")
    );

    if (timestampCol === -1 || glucoseCol === -1) {
      throw new Error(
        "Could not find timestamp and glucose value columns in the CSV."
      );
    }

    const readings: { timestamp: string; value: number }[] = [];
    const dates: Date[] = [];

    for (let i = headerIndex + 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/"/g, ""));
      const timestamp = cols[timestampCol];
      const value = parseFloat(cols[glucoseCol]);

      if (timestamp && !isNaN(value) && value > 20 && value < 600) {
        readings.push({ timestamp, value });
        const d = new Date(timestamp);
        if (!isNaN(d.getTime())) {
          dates.push(d);
        }
      }
    }

    if (readings.length === 0) {
      throw new Error("No valid glucose readings found in the file.");
    }

    dates.sort((a, b) => a.getTime() - b.getTime());

    return {
      readings,
      preview: {
        count: readings.length,
        startDate: dates[0].toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        endDate: dates[dates.length - 1].toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      },
    };
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setUploadedFile(file);
      setUploadError(null);
      setUploadPreview(null);
      setUploadSuccess(false);

      if (!file.name.endsWith(".csv")) {
        setUploadError("Please upload a CSV file.");
        return;
      }

      try {
        const result = await parseCSV(file);
        setUploadPreview(result.preview);
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Failed to parse CSV file."
        );
      }
    },
    [parseCSV]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleUpload = useCallback(async () => {
    if (!uploadedFile) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await parseCSV(uploadedFile);

      const response = await fetch("/api/glucose/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readings: result.readings }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Upload failed with status ${response.status}`
        );
      }

      setUploadSuccess(true);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  }, [uploadedFile, parseCSV]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold" style={{ color: "#1A1A2E" }}>
          Let&apos;s get your blood sugar data in
        </h1>
        <p className="text-lg" style={{ color: "#6B7280" }}>
          The more data Steadii has, the better it can help you.
        </p>
      </div>

      {/* Option cards */}
      <div className="space-y-4">
        {/* Dexcom OAuth */}
        <button
          type="button"
          onClick={() => setSelectedMethod("dexcom")}
          className="w-full relative flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300"
          style={{
            backgroundColor:
              selectedMethod === "dexcom" ? "#F0EEF8" : "#F8F7F5",
            borderColor:
              selectedMethod === "dexcom" ? "#8B7EC8" : "transparent",
            opacity: 0.6,
          }}
          disabled
        >
          {/* Dexcom logo placeholder */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
            style={{ backgroundColor: "#4CA750", color: "white" }}
          >
            DX
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className="font-semibold text-base"
                style={{ color: "#1A1A2E" }}
              >
                Connect Dexcom
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
              >
                Coming soon
              </span>
            </div>
            <span className="text-sm" style={{ color: "#6B7280" }}>
              Connect your CGM for automatic syncing
            </span>
          </div>
        </button>

        {/* CSV Upload */}
        <button
          type="button"
          onClick={() => setSelectedMethod("csv")}
          className="w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300 hover:scale-[1.01]"
          style={{
            backgroundColor:
              selectedMethod === "csv" ? "#F0EEF8" : "#F8F7F5",
            borderColor:
              selectedMethod === "csv" ? "#8B7EC8" : "transparent",
            boxShadow:
              selectedMethod === "csv"
                ? "0 4px 16px rgba(139, 126, 200, 0.15)"
                : "none",
          }}
        >
          {/* Upload icon */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#F0EEF8" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15"
                stroke="#8B7EC8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 8L12 3L7 8"
                stroke="#8B7EC8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 3V15"
                stroke="#8B7EC8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex-1">
            <span
              className="font-semibold text-base"
              style={{ color: "#1A1A2E" }}
            >
              Upload CSV
            </span>
            <br />
            <span className="text-sm" style={{ color: "#6B7280" }}>
              Import from Dexcom Clarity export
            </span>
          </div>
        </button>

        {/* Skip */}
        <button
          type="button"
          onClick={() => {
            setSelectedMethod("skip");
            onComplete("skip");
          }}
          className="w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300 hover:scale-[1.01]"
          style={{
            backgroundColor:
              selectedMethod === "skip" ? "#F0EEF8" : "#F8F7F5",
            borderColor:
              selectedMethod === "skip" ? "#8B7EC8" : "transparent",
          }}
        >
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#F3F4F6" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M13 5L20 12L13 19M4 12H20"
                stroke="#6B7280"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex-1">
            <span
              className="font-semibold text-base"
              style={{ color: "#1A1A2E" }}
            >
              Skip for now
            </span>
            <br />
            <span className="text-sm" style={{ color: "#6B7280" }}>
              I&apos;ll enter readings manually
            </span>
          </div>
        </button>
      </div>

      {/* CSV Upload Zone */}
      {selectedMethod === "csv" && (
        <div className="space-y-4 animate-[fadeSlideIn_0.3s_ease-out]">
          {/* Drop zone */}
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer"
            style={{
              borderColor: isDragging ? "#8B7EC8" : "#D1D5DB",
              backgroundColor: isDragging ? "#F0EEF8" : "#FAFAFA",
            }}
            onClick={() =>
              document.getElementById("csv-file-input")?.click()
            }
          >
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              className="mb-3"
            >
              <rect
                width="40"
                height="40"
                rx="12"
                fill={isDragging ? "#8B7EC8" : "#F0EEF8"}
              />
              <path
                d="M25 21L20 16L15 21"
                stroke={isDragging ? "white" : "#8B7EC8"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 16V28"
                stroke={isDragging ? "white" : "#8B7EC8"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M28.4 24.4C29.4 23.7 30 22.6 30 21.4C30 19.2 28.2 17.4 26 17.4H25.2C24.5 14.4 21.8 12 18.8 12C15.1 12 12 15 12 18.8C12 20.3 12.5 21.7 13.4 22.8"
                stroke={isDragging ? "white" : "#8B7EC8"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p
              className="text-sm font-medium"
              style={{ color: isDragging ? "#8B7EC8" : "#1A1A2E" }}
            >
              {isDragging
                ? "Drop your file here"
                : "Drag & drop your CSV file here"}
            </p>
            <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
              or click to browse
            </p>
          </div>

          {/* Upload error */}
          {uploadError && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle
                  cx="10"
                  cy="10"
                  r="9"
                  stroke="#DC2626"
                  strokeWidth="1.5"
                />
                <path
                  d="M10 6V10.5M10 14H10.01"
                  stroke="#DC2626"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-sm">{uploadError}</span>
            </div>
          )}

          {/* Upload preview */}
          {uploadPreview && !uploadSuccess && (
            <div
              className="p-5 rounded-2xl space-y-4"
              style={{ backgroundColor: "#F0FDF4" }}
            >
              <div className="flex items-center gap-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="11" stroke="#16A34A" strokeWidth="2" />
                  <path
                    d="M7 12L10.5 15.5L17 8.5"
                    stroke="#16A34A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: "#166534" }}
                  >
                    Found {uploadPreview.count.toLocaleString()} readings
                  </p>
                  <p className="text-xs" style={{ color: "#15803D" }}>
                    From {uploadPreview.startDate} to {uploadPreview.endDate}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#8B7EC8" }}
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="white"
                        strokeWidth="3"
                        strokeDasharray="31.4 31.4"
                        strokeLinecap="round"
                      />
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  "Upload & Import"
                )}
              </button>
            </div>
          )}

          {/* Upload success */}
          {uploadSuccess && (
            <div
              className="p-5 rounded-2xl text-center space-y-3"
              style={{ backgroundColor: "#F0FDF4" }}
            >
              <div className="flex justify-center">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="23" stroke="#16A34A" strokeWidth="2" />
                  <path
                    d="M14 24L21 31L34 17"
                    stroke="#16A34A"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p
                className="font-semibold text-lg"
                style={{ color: "#166534" }}
              >
                Data imported successfully!
              </p>
              <p className="text-sm" style={{ color: "#15803D" }}>
                {uploadPreview?.count.toLocaleString()} readings from{" "}
                {uploadPreview?.startDate} to {uploadPreview?.endDate}
              </p>
              <button
                type="button"
                onClick={() => onComplete("csv", uploadPreview)}
                className="mt-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:opacity-90"
                style={{ backgroundColor: "#8B7EC8" }}
              >
                Continue
              </button>
            </div>
          )}

          {/* Uploaded file info */}
          {uploadedFile && !uploadPreview && !uploadError && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: "#F8F7F5" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect
                  x="3"
                  y="2"
                  width="14"
                  height="16"
                  rx="2"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                />
                <path
                  d="M7 7H13M7 10H13M7 13H10"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-sm" style={{ color: "#1A1A2E" }}>
                {uploadedFile.name}
              </span>
              <span className="text-xs ml-auto" style={{ color: "#6B7280" }}>
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
