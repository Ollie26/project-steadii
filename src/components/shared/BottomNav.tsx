"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Utensils, User } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/log", label: "Log", icon: PlusCircle, emphasized: true },
  { href: "/meals", label: "Meals", icon: Utensils },
  { href: "/you", label: "You", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-steadii-border safe-bottom">
      <div className="max-w-[480px] mx-auto flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                flex flex-col items-center justify-center gap-0.5
                min-h-[44px] min-w-[44px] px-3 py-2 rounded-steadii-md
                transition-colors duration-200
                ${active ? "text-steadii-accent" : "text-steadii-text-tertiary"}
              `}
            >
              {tab.emphasized ? (
                <span
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    transition-colors duration-200
                    ${active
                      ? "bg-steadii-accent/10"
                      : "bg-steadii-card"
                    }
                  `}
                >
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.5 : 2}
                    className={active ? "text-steadii-accent" : "text-steadii-text-secondary"}
                  />
                </span>
              ) : (
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 2}
                />
              )}
              <span
                className={`text-[10px] leading-tight ${
                  active ? "font-semibold" : "font-medium"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
