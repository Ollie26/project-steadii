"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { MealItem } from "./MealItemCard";
import ServingSizeAdjuster from "./ServingSizeAdjuster";

interface BarcodeScannerProps {
  onAddItem: (item: MealItem) => void;
}

interface ProductData {
  name: string;
  brand?: string;
  servingSize: string;
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
  fiber?: number;
  barcode: string;
}

type ScannerState = "scanning" | "loading" | "found" | "not-found" | "error";

export default function BarcodeScanner({ onAddItem }: BarcodeScannerProps) {
  const [state, setState] = useState<ScannerState>("scanning");
  const [product, setProduct] = useState<ProductData | null>(null);
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const quaggaInitialized = useRef(false);

  const stopScanner = useCallback(async () => {
    try {
      const Quagga = (await import("@ericblade/quagga2")).default;
      Quagga.stop();
      quaggaInitialized.current = false;
    } catch {
      // quagga not loaded
    }
  }, []);

  const lookupBarcode = useCallback(async (code: string) => {
    setState("loading");
    try {
      const res = await fetch(
        `/api/food/barcode?code=${encodeURIComponent(code)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.name) {
          setProduct({ ...data, barcode: code });
          setState("found");
          return;
        }
      }
      setState("not-found");
    } catch {
      setState("not-found");
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current || quaggaInitialized.current) return;

    try {
      const Quagga = (await import("@ericblade/quagga2")).default;

      await Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            target: scannerRef.current!,
            constraints: {
              facingMode: "environment",
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
          },
          decoder: {
            readers: [
              "ean_reader",
              "ean_8_reader",
              "upc_reader",
              "upc_e_reader",
            ],
          },
          locate: true,
          frequency: 10,
        },
        (err: unknown) => {
          if (err) {
            console.error("Quagga init error:", err);
            setPermissionDenied(true);
            return;
          }
          quaggaInitialized.current = true;
          Quagga.start();
        }
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Quagga.onDetected((result: any) => {
        const code = result?.codeResult?.code as string | null | undefined;
        if (code) {
          stopScanner();
          lookupBarcode(code);
        }
      });
    } catch (err) {
      console.error("Failed to load Quagga:", err);
      setPermissionDenied(true);
    }
  }, [stopScanner, lookupBarcode]);

  useEffect(() => {
    if (state === "scanning") {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [state, startScanner, stopScanner]);

  const confirmProduct = () => {
    if (!product) return;
    onAddItem({
      id: crypto.randomUUID(),
      name: product.name,
      servingSize: product.servingSize,
      servingMultiplier,
      carbs: product.carbs,
      protein: product.protein,
      fat: product.fat,
      calories: product.calories,
    });
    // Reset for next scan
    setProduct(null);
    setServingMultiplier(1);
    setState("scanning");
  };

  const retryScan = () => {
    setProduct(null);
    setServingMultiplier(1);
    setState("scanning");
  };

  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 text-[#E76F6F]"
          >
            <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 3.42l-1.08-1.08a9.743 9.743 0 002.18-2.79.75.75 0 00-.009-.642A9.75 9.75 0 0012 5.25c-1.174 0-2.3.207-3.344.59L7.418 4.602A11.209 11.209 0 0112 3.75c6.044 0 10.258 4.544 10.676 5.053a.75.75 0 01.001.75zM15.75 12a3.75 3.75 0 01-3.159 3.705L8.886 12l6.864.001z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Camera Access Required
          </h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Please allow camera access in your browser settings to scan
            barcodes. You can also try the Search or Manual entry tabs instead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {state === "scanning" && (
        <>
          <div
            ref={scannerRef}
            className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden"
          >
            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-64 h-32 border-2 border-white/60 rounded-xl relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-[#8B7EC8] rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-[#8B7EC8] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-[#8B7EC8] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-[#8B7EC8] rounded-br-lg" />
                {/* Scan line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-[#8B7EC8]/80 top-1/2 animate-pulse" />
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500">
            Point camera at a barcode
          </p>
        </>
      )}

      {state === "loading" && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-[#8B7EC8] rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Looking up product...</p>
        </div>
      )}

      {state === "found" && product && (
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
            <h3 className="text-base font-semibold text-gray-800">
              {product.name}
            </h3>
            {product.brand && (
              <p className="text-sm text-gray-400 mt-0.5">{product.brand}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Serving: {product.servingSize}
            </p>

            <div className="grid grid-cols-4 gap-3 mt-4 text-center">
              <div>
                <p className="text-lg font-bold text-[#8B7EC8]">
                  {Math.round(product.carbs * servingMultiplier)}g
                </p>
                <p className="text-[10px] text-gray-400">Carbs</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-600">
                  {Math.round(product.protein * servingMultiplier)}g
                </p>
                <p className="text-[10px] text-gray-400">Protein</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-600">
                  {Math.round(product.fat * servingMultiplier)}g
                </p>
                <p className="text-[10px] text-gray-400">Fat</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-600">
                  {Math.round(product.calories * servingMultiplier)}
                </p>
                <p className="text-[10px] text-gray-400">Cal</p>
              </div>
            </div>

            <div className="mt-4">
              <ServingSizeAdjuster
                value={servingMultiplier}
                onChange={setServingMultiplier}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={retryScan}
              className="flex-1 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Scan Another
            </button>
            <button
              type="button"
              onClick={confirmProduct}
              className="flex-1 py-3 rounded-full bg-[#8B7EC8] text-white text-sm font-semibold hover:bg-[#7a6db7] transition-colors shadow-sm"
            >
              Add to Meal
            </button>
          </div>
        </div>
      )}

      {state === "not-found" && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-7 h-7 text-[#F4A261]"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">
              Product Not Found
            </h3>
            <p className="text-sm text-gray-500">
              This barcode isn&apos;t in our database yet.
            </p>
          </div>
          <div className="flex gap-3 w-full max-w-xs">
            <button
              type="button"
              onClick={retryScan}
              className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => {
                // Reset to allow manual entry via another tab
                retryScan();
              }}
              className="flex-1 py-2.5 rounded-full bg-[#8B7EC8] text-white text-sm font-medium hover:bg-[#7a6db7] transition-colors"
            >
              Enter Manually
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
