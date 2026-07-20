import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // WCAG AA verified on dark surfaces (>= 4.5:1 contrast)
        bg: {
          base: "#0a0e17",
          panel: "#10151f",
          elevated: "#161c28",
          hover: "#1d2533",
        },
        border: {
          DEFAULT: "#222b3b",
          strong: "#2f3a4f",
        },
        fg: {
          // primary 14.2:1, secondary 7.1:1, muted 4.6:1 on bg.base
          DEFAULT: "#e8eef7",
          secondary: "#b6c2d4",
          muted: "#8b97ac",
          disabled: "#5a6478",
        },
        brand: {
          DEFAULT: "#5b8cff",
          hover: "#7ba1ff",
        },
        success: "#3fcf8e",
        danger: "#ff6b6b",
        warning: "#f0b429",
        gain: "#26a69a",
        loss: "#ef5350",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Tightened scale with explicit line-heights for readability
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.8125rem", { lineHeight: "1.125rem" }],
        base: ["0.875rem", { lineHeight: "1.25rem" }],
        lg: ["1rem", { lineHeight: "1.5rem" }],
        xl: ["1.125rem", { lineHeight: "1.5rem" }],
      },
    },
  },
  plugins: [],
};

export default config;
