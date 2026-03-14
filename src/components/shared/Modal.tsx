"use client";

import { useEffect, useCallback, ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className="
          relative w-full max-w-[480px] max-h-[85vh]
          bg-white rounded-t-steadii-xl
          shadow-steadii-lg
          animate-slide-up
          flex flex-col
          safe-bottom
        "
        role="dialog"
        aria-modal="true"
        aria-label={title || "Dialog"}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-steadii-border" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pb-3 pt-1">
            <h2 className="text-lg font-semibold text-steadii-text">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="
                flex items-center justify-center w-8 h-8 rounded-full
                hover:bg-steadii-card transition-colors
                tap-target
              "
              aria-label="Close"
            >
              <X size={18} className="text-steadii-text-secondary" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
