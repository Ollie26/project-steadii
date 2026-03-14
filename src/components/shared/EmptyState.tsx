import { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12">
      <div className="w-16 h-16 rounded-full bg-steadii-card flex items-center justify-center mb-4 text-steadii-accent">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-steadii-text mb-2">
        {title}
      </h3>
      <p className="text-sm text-steadii-text-secondary leading-relaxed max-w-[280px] mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary text-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
