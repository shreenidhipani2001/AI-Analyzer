import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand:  "#ff7a2f",
        coral:  { DEFAULT: "#ff7a2f", dark: "#e85e10", light: "#ffaa70" },
        amber:  { DEFAULT: "#ffcd3c", light: "#ffe07a", dark: "#e6a800" },
        sunny:  { bg1: "#ff9a56", bg2: "#ffcd3c", card: "#ffffff" },
      },
      fontFamily: {
        display: ["Poppins", "system-ui", "sans-serif"],
        body:    ["Poppins", "system-ui", "sans-serif"],
      },
      animation: {
        bounce2:  "bounce2 2s ease-in-out infinite",
        wiggle:   "wiggle 1.6s ease-in-out infinite",
        float:    "float 3s ease-in-out infinite",
        glow:     "glow 2s ease-in-out infinite",
        reading:  "reading 1.6s ease-in-out infinite",
        fadeinup: "fadeinup 0.35s ease-out both",
      },
      keyframes: {
        bounce2: {
          "0%,100%": { transform: "translateY(0px) scale(1)" },
          "40%":     { transform: "translateY(-12px) scale(1.03)" },
          "60%":     { transform: "translateY(-6px) scale(1.01)" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-3deg)" },
          "50%":     { transform: "rotate(3deg)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-8px)" },
        },
        glow: {
          "0%,100%": { filter: "drop-shadow(0 0 6px #ff7a2f88)" },
          "50%":     { filter: "drop-shadow(0 0 16px #ffcd3ccc)" },
        },
        reading: {
          "0%,100%": { transform: "rotate(-2deg) translateY(0px)" },
          "50%":     { transform: "rotate(2deg) translateY(-4px)" },
        },
        fadeinup: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        card:   "0 4px 20px rgba(255, 122, 47, 0.15)",
        button: "0 4px 14px rgba(255, 122, 47, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
