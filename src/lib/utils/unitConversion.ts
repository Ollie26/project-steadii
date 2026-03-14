import type { GlucoseUnit, WeightUnit, HeightUnit } from "@/types";

// --- Glucose ---

/** Convert mg/dL to mmol/L. */
export function mgdlToMmol(mgdl: number): number {
  return mgdl / 18.0182;
}

/** Convert mmol/L to mg/dL. */
export function mmolToMgdl(mmol: number): number {
  return mmol * 18.0182;
}

/** Convert a glucose value between units. Returns the value unchanged if units match. */
export function convertGlucose(
  value: number,
  fromUnit: GlucoseUnit,
  toUnit: GlucoseUnit,
): number {
  if (fromUnit === toUnit) return value;
  if (fromUnit === "mgdl" && toUnit === "mmol") return mgdlToMmol(value);
  if (fromUnit === "mmol" && toUnit === "mgdl") return mmolToMgdl(value);
  return value;
}

// --- Weight ---

/** Convert pounds to kilograms. */
export function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

/** Convert kilograms to pounds. */
export function kgToLbs(kg: number): number {
  return kg / 0.453592;
}

/** Convert a weight value between units. Returns the value unchanged if units match. */
export function convertWeight(
  value: number,
  fromUnit: WeightUnit,
  toUnit: WeightUnit,
): number {
  if (fromUnit === toUnit) return value;
  if (fromUnit === "lbs" && toUnit === "kg") return lbsToKg(value);
  if (fromUnit === "kg" && toUnit === "lbs") return kgToLbs(value);
  return value;
}

// --- Height ---

/** Convert inches to centimetres. */
export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

/** Convert centimetres to inches. */
export function cmToInches(cm: number): number {
  return cm / 2.54;
}

/** Convert a height value between units. Returns the value unchanged if units match. */
export function convertHeight(
  value: number,
  fromUnit: HeightUnit,
  toUnit: HeightUnit,
): number {
  if (fromUnit === toUnit) return value;
  if (fromUnit === "inches" && toUnit === "cm") return inchesToCm(value);
  if (fromUnit === "cm" && toUnit === "inches") return cmToInches(value);
  return value;
}
