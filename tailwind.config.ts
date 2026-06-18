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
        cp: {
          cyan: "#00f0ff",
          "cyan-dim": "#00a0b0",
          magenta: "#ff003c",
          "magenta-dim": "#b8002a",
          yellow: "#fcee09",
          "yellow-dim": "#c4b800",
          orange: "#ff6b35",
          green: "#39ff14",
        },
        surface: {
          0: "#06060f",
          1: "#0c0c1a",
          2: "#121225",
          3: "#1a1a30",
          4: "#22223a",
        },
        "cp-border": {
          subtle: "rgba(0,240,255,0.06)",
          DEFAULT: "rgba(0,240,255,0.12)",
          bright: "rgba(0,240,255,0.25)",
        },
        "cp-text": {
          DEFAULT: "#e8edf8",
          dim: "#8b93b4",
        },
      },
      fontFamily: {
        rajdhani: ["var(--font-rajdhani)", "Rajdhani", "sans-serif"],
        mono: ["var(--font-share-tech-mono)", "Share Tech Mono", "monospace"],
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "50%": { opacity: "0.6", filter: "brightness(1.4)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100vh)" },
          "100%": { transform: "translateY(100vh)" },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 1px)" },
          "40%": { transform: "translate(2px, -1px)" },
          "60%": { transform: "translate(-1px, -2px)" },
          "80%": { transform: "translate(1px, 2px)" },
        },
        "flicker-in": {
          "0%": { opacity: "0" },
          "10%": { opacity: "0.6" },
          "20%": { opacity: "0.2" },
          "30%": { opacity: "0.8" },
          "40%": { opacity: "0.4" },
          "50%": { opacity: "1" },
          "100%": { opacity: "1" },
        },
        "border-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        "holo-shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        scanline: "scanline 8s linear infinite",
        "glitch-loop": "glitch 2.5s ease-in-out infinite",
        "flicker-in": "flicker-in 0.6s ease-out forwards",
        "border-flow": "border-flow 3s linear infinite",
        "holo-shimmer": "holo-shimmer 4s ease-in-out infinite",
      },
      backgroundImage: {
        "circuit-grid":
          "linear-gradient(rgba(0,240,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.02) 1px, transparent 1px)",
      },
      backgroundSize: {
        "circuit-grid": "48px 48px",
      },
    },
  },
  plugins: [],
};
export default config;
