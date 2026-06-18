import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Cyberpunk 2077 palette
        cp: {
          cyan: "#00f0ff",
          "cyan-dim": "#00a0b0",
          magenta: "#ff003c",
          "magenta-dim": "#b8002a",
          yellow: "#fcee09",
          "yellow-dim": "#c4b800",
          blue: "#1a1aff",
          orange: "#ff6b35",
          green: "#39ff14",
        },
        // Surface layers (deep dark with slight blue tint)
        surface: {
          0: "#06060f",
          1: "#0c0c1a",
          2: "#121225",
          3: "#1a1a30",
          4: "#22223a",
        },
        border: {
          subtle: "rgba(0,240,255,0.06)",
          DEFAULT: "rgba(0,240,255,0.12)",
          bright: "rgba(0,240,255,0.25)",
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
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 1px)" },
          "40%": { transform: "translate(2px, -1px)" },
          "60%": { transform: "translate(-1px, -2px)" },
          "80%": { transform: "translate(1px, 2px)" },
        },
        "glitch-skew": {
          "0%, 100%": { transform: "skew(0deg)" },
          "20%": { transform: "skew(-0.5deg)" },
          "60%": { transform: "skew(0.5deg)" },
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
        "data-stream": {
          "0%": { transform: "translateY(0)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(100vh)", opacity: "0" },
        },
        "neon-pulse": {
          "0%, 100%": {
            textShadow: "0 0 4px #00f0ff, 0 0 11px #00f0ff, 0 0 19px #00f0ff",
          },
          "50%": {
            textShadow: "0 0 2px #00f0ff, 0 0 5px #00f0ff, 0 0 10px #00f0ff",
          },
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
        glitch: "glitch 0.3s ease-in-out",
        "glitch-loop": "glitch 2s ease-in-out infinite",
        "glitch-skew": "glitch-skew 2s ease-in-out infinite",
        "flicker-in": "flicker-in 0.6s ease-out forwards",
        "data-stream": "data-stream 4s linear infinite",
        "neon-pulse": "neon-pulse 2s ease-in-out infinite",
        "border-flow": "border-flow 3s linear infinite",
        "holo-shimmer": "holo-shimmer 3s ease-in-out infinite",
      },
      backgroundImage: {
        "circuit-grid":
          "linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px)",
        "cyber-gradient":
          "linear-gradient(135deg, rgba(0,240,255,0.05) 0%, transparent 50%, rgba(255,0,60,0.05) 100%)",
      },
      backgroundSize: {
        "circuit-grid": "40px 40px",
      },
    },
  },
  plugins: [],
};
export default config;
