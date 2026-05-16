import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0F1E3D",
          900: "#08122A",
          800: "#0F1E3D",
          700: "#1A2D55",
          600: "#274073",
        },
        burgundy: {
          DEFAULT: "#7A1C2E",
          700: "#5E1422",
          500: "#7A1C2E",
          400: "#9B273D",
        },
        bone: "#FAF7F2",
        ink: "#1B2230",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
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
