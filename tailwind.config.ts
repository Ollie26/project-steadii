import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "steadii-bg": "#FFFFFF",
        "steadii-card": "#F8F7F5",
        "steadii-accent": {
          DEFAULT: "#8B7EC8",
          light: "#B8ADE8",
        },
        "steadii-secondary": "#6BA3E8",
        "steadii-in-range": "#4ECDC4",
        "steadii-high": {
          DEFAULT: "#F4A261",
          severe: "#E07B39",
        },
        "steadii-low": {
          DEFAULT: "#E76F6F",
          severe: "#D14545",
        },
        "steadii-text": {
          DEFAULT: "#1A1A2E",
          secondary: "#6B7280",
          tertiary: "#9CA3AF",
        },
        "steadii-border": {
          DEFAULT: "#E5E7EB",
          light: "#F3F4F6",
        },
      },
      fontFamily: {
        body: ["var(--font-body)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "steadii-sm": "0 1px 3px rgba(0, 0, 0, 0.04)",
        "steadii-md": "0 4px 12px rgba(0, 0, 0, 0.06)",
        "steadii-lg": "0 8px 24px rgba(0, 0, 0, 0.08)",
      },
      borderRadius: {
        "steadii-sm": "8px",
        "steadii-md": "12px",
        "steadii-lg": "16px",
        "steadii-xl": "24px",
      },
    },
  },
  plugins: [],
};

export default config;
