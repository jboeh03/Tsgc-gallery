import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Brand kit per Jeff's Tri-State Grill Cleaning style guide.
      colors: {
        navy: {
          DEFAULT: "#1A3055",
          900: "#102140",
          800: "#1A3055",
          700: "#2C4A6E",
          600: "#3D6390",
        },
        burgundy: {
          DEFAULT: "#8B1F2F",
          700: "#6E1825",
          500: "#8B1F2F",
          400: "#A82B3D",
        },
        bone: "#F7F3EE",
        ink: "#3D3D3A",
        muted: "#6E6E68",
        border: "#E5E0D8",
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
      boxShadow: {
        knob: "0 4px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -3px 6px rgba(0,0,0,0.5)",
        lid: "0 18px 30px rgba(0,0,0,0.45), inset 0 2px 0 rgba(255,255,255,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
