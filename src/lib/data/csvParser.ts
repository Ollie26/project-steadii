// ============================================================
// Parse Dexcom Clarity CSV exports
// ============================================================

export interface ParsedReading {
  timestamp: Date;
  value: number; // mg/dL
}

export interface CSVParseResult {
  readings: ParsedReading[];
  count: number;
  format: "clarity" | "receiver" | "unknown";
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  errors: string[];
}

/**
 * Parse a Dexcom CSV file (supports both Clarity and receiver formats).
 *
 * Dexcom Clarity CSV quirks:
 * - First ~10 rows are metadata (device info, patient info, export date)
 * - Header row contains: "Index", "Timestamp (YYYY-MM-DDThh:mm:ss)", "Event Type",
 *   "Event Subtype", "Patient Info", "Device Info", "Source Device ID",
 *   "Glucose Value (mg/dL)", "Insulin Value (u)", "Carb Value (grams)", ...
 * - EGV rows have Event Type === "EGV"
 *
 * Simpler Dexcom receiver CSV format:
 * - Columns: GlucoseDisplayTime, GlucoseValue (or similar)
 * - No Event Type filtering needed
 */
export function parseDexcomCSV(fileContent: string): CSVParseResult {
  const errors: string[] = [];
  const lines = fileContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return {
      readings: [],
      count: 0,
      format: "unknown",
      dateRange: { start: null, end: null },
      errors: ["File is empty or has no data rows"],
    };
  }

  // Find the header row
  const headerIndex = findHeaderRow(lines);

  if (headerIndex === -1) {
    return {
      readings: [],
      count: 0,
      format: "unknown",
      dateRange: { start: null, end: null },
      errors: [
        'Could not find header row. Expected columns containing "Timestamp" and "Glucose Value" or "Event Type".',
      ],
    };
  }

  const headers = parseCSVRow(lines[headerIndex]);
  const format = detectFormat(headers);

  // Map column indices
  const columnMap = buildColumnMap(headers, format);

  if (columnMap.timestamp === -1 || columnMap.glucose === -1) {
    return {
      readings: [],
      count: 0,
      format,
      dateRange: { start: null, end: null },
      errors: ["Could not find required timestamp and glucose columns"],
    };
  }

  // Parse data rows
  const readings: ParsedReading[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);

    // For Clarity format, only process EGV rows
    if (format === "clarity" && columnMap.eventType !== -1) {
      const eventType = (row[columnMap.eventType] || "").trim();
      if (eventType !== "EGV") continue;
    }

    // Extract timestamp
    const timestampStr = (row[columnMap.timestamp] || "").trim();
    if (!timestampStr) continue;

    const timestamp = parseTimestamp(timestampStr);
    if (!timestamp || isNaN(timestamp.getTime())) {
      errors.push(`Invalid timestamp at row ${i + 1}: "${timestampStr}"`);
      continue;
    }

    // Extract glucose value
    const glucoseStr = (row[columnMap.glucose] || "").trim();
    if (!glucoseStr) continue;

    // Handle "Low" and "High" values from Dexcom
    if (
      glucoseStr.toLowerCase() === "low" ||
      glucoseStr.toLowerCase() === "high"
    ) {
      continue; // Skip non-numeric values
    }

    const value = parseFloat(glucoseStr);
    if (isNaN(value)) {
      errors.push(`Invalid glucose value at row ${i + 1}: "${glucoseStr}"`);
      continue;
    }

    // Validate range: 40-400 mg/dL
    if (value < 40 || value > 400) {
      errors.push(
        `Glucose value out of range at row ${i + 1}: ${value} mg/dL`
      );
      continue;
    }

    readings.push({ timestamp, value });
  }

  // Sort by timestamp ascending
  readings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Deduplicate by timestamp (keep first)
  const deduped = deduplicateReadings(readings);

  return {
    readings: deduped,
    count: deduped.length,
    format,
    dateRange: {
      start: deduped.length > 0 ? deduped[0].timestamp : null,
      end: deduped.length > 0 ? deduped[deduped.length - 1].timestamp : null,
    },
    errors: errors.length > 10 ? [...errors.slice(0, 10), `...and ${errors.length - 10} more errors`] : errors,
  };
}

/**
 * Find the header row index by looking for key column names.
 */
function findHeaderRow(lines: string[]): number {
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const lower = lines[i].toLowerCase();
    if (
      (lower.includes("timestamp") && (lower.includes("glucose") || lower.includes("event type"))) ||
      (lower.includes("glucosedisplaytime") || lower.includes("glucose display time")) ||
      (lower.includes("glucose value") && lower.includes("timestamp"))
    ) {
      return i;
    }
  }
  return -1;
}

/**
 * Detect whether this is Clarity or receiver format.
 */
function detectFormat(
  headers: string[]
): "clarity" | "receiver" | "unknown" {
  const headerStr = headers.join(",").toLowerCase();

  if (headerStr.includes("event type") && headerStr.includes("glucose value")) {
    return "clarity";
  }

  if (
    headerStr.includes("glucosedisplaytime") ||
    headerStr.includes("glucose display time") ||
    headerStr.includes("glucosevalue")
  ) {
    return "receiver";
  }

  if (headerStr.includes("timestamp") && headerStr.includes("glucose")) {
    return "clarity"; // Assume Clarity for generic format
  }

  return "unknown";
}

interface ColumnMap {
  timestamp: number;
  glucose: number;
  eventType: number;
}

/**
 * Build a map of column indices from headers.
 */
function buildColumnMap(
  headers: string[],
  format: string
): ColumnMap {
  const map: ColumnMap = {
    timestamp: -1,
    glucose: -1,
    eventType: -1,
  };

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase().trim();

    // Timestamp column
    if (
      h.includes("timestamp") ||
      h === "glucosedisplaytime" ||
      h === "glucose display time"
    ) {
      map.timestamp = i;
    }

    // Glucose value column
    if (
      h.includes("glucose value") ||
      h === "glucosevalue" ||
      h === "glucose_value" ||
      (h === "value" && format === "receiver")
    ) {
      map.glucose = i;
    }

    // Event type column (Clarity only)
    if (h === "event type" || h === "event_type" || h === "eventtype") {
      map.eventType = i;
    }
  }

  return map;
}

/**
 * Parse a CSV row, handling quoted fields.
 */
function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parse various timestamp formats from Dexcom CSVs.
 */
function parseTimestamp(str: string): Date | null {
  // Remove surrounding quotes
  const cleaned = str.replace(/^["']|["']$/g, "").trim();

  // Try ISO format first (YYYY-MM-DDThh:mm:ss)
  const isoDate = new Date(cleaned);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try MM/DD/YYYY HH:MM:SS format
  const usMatch = cleaned.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/
  );
  if (usMatch) {
    const [, month, day, year, hours, minutes, seconds] = usMatch;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds || "0")
    );
  }

  // Try YYYY-MM-DD HH:MM:SS (space instead of T)
  const spaceIso = cleaned.replace(" ", "T");
  const spaceDate = new Date(spaceIso);
  if (!isNaN(spaceDate.getTime())) {
    return spaceDate;
  }

  return null;
}

/**
 * Remove duplicate readings that have the same timestamp.
 */
function deduplicateReadings(readings: ParsedReading[]): ParsedReading[] {
  const seen = new Set<number>();
  return readings.filter((r) => {
    const key = r.timestamp.getTime();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
