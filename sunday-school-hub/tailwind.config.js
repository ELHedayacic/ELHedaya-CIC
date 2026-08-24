/** @type {import('tailwindcss').Config} */
// ---------------------------------------------------------------------
// Light-theme pass. Two different mechanisms are at work here, so it's
// worth spelling out which is which:
//
// 1. The `twilight` neutral scale was fully reversed — same class names
//    throughout the app (bg-twilight-900, text-twilight-50, etc.), just
//    reassigned to the opposite lightness at each role. Every non-auth
//    page flips automatically with zero changes to its own className
//    strings. twilight-950 is the one deliberate exception — kept dark,
//    since it's the modal backdrop overlay, which conventionally stays
//    dark even in light-mode apps.
//
// 2. aurora / amber / grow / coral / sky (the accent colors) were NOT
//    reversed. Their existing 300/400/500/600 shades are exactly what
//    they were before, untouched — because the auth pages (which stay on
//    a fixed dark photo background, see AuthShell.tsx) depend on several
//    of those exact values staying light enough to read against a dark
//    card. Instead, new 700/800 shades were added for wherever the rest
//    of the app needs a properly dark, light-background-legible version
//    of an accent color as text. If you're hunting for "why is this
//    green a different number than before" in a component file, that's
//    why — it was deliberately redirected to a new deep variant rather
//    than the old value being changed out from under it.
// ---------------------------------------------------------------------
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        twilight: {
          DEFAULT: "#F7F6EE",
          50: "#16211B",
          100: "#26332B",
          200: "#5C6D62",
          800: "#FFFFFF",
          850: "#FFFFFF",
          900: "#F7F6EE",
          950: "#12190F",
        },
        aurora: {
          DEFAULT: "#14966B",
          50: "#EAF9F1",
          100: "#CDEEDD",
          300: "#5FCE9E",
          400: "#3AB884",
          500: "#14966B",
          600: "#0E7A56",
          700: "#0A5F43",
        },
        amber: {
          DEFAULT: "#D2A44A",
          400: "#E3BE6E",
          500: "#D2A44A",
          600: "#B3872F",
          700: "#8C6417",
          800: "#6B4E12",
        },
        grow: {
          DEFAULT: "#2AABA0",
          300: "#7DD8CE",
          400: "#4FC4B9",
          500: "#2AABA0",
          600: "#1F8880",
          700: "#145C56",
        },
        coral: {
          DEFAULT: "#E2694E",
          400: "#EA8A73",
          500: "#E2694E",
          600: "#C74F37",
          700: "#8A3220",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
        "serif-display": ["'Playfair Display'", "serif"],
        "serif-body": ["'Lora'", "serif"],
      },
      backgroundImage: {
        "aurora-glow":
          "radial-gradient(60% 60% at 20% 10%, rgba(20,150,107,0.10) 0%, rgba(20,150,107,0) 60%), radial-gradient(50% 50% at 85% 20%, rgba(210,164,74,0.09) 0%, rgba(210,164,74,0) 60%), radial-gradient(70% 70% at 50% 100%, rgba(42,171,160,0.08) 0%, rgba(42,171,160,0) 60%)",
        "card-glass":
          "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.1) 100%)",
        "gold-hairline": "linear-gradient(90deg, rgba(140,100,23,0) 0%, rgba(140,100,23,0.55) 50%, rgba(140,100,23,0) 100%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(20,150,107,0.18), 0 8px 24px -8px rgba(20,150,107,0.22)",
        "glow-amber": "0 0 0 1px rgba(140,100,23,0.20), 0 8px 24px -8px rgba(140,100,23,0.20)",
        card: "0 1px 0 0 rgba(255,255,255,0.7) inset, 0 1px 2px 0 rgba(22,33,27,0.04), 0 12px 28px -12px rgba(22,33,27,0.12)",
        "card-gold": "0 1px 0 0 rgba(255,255,255,0.7) inset, 0 12px 28px -12px rgba(22,33,27,0.14), 0 0 32px -14px rgba(140,100,23,0.18)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: 0.5 },
          "50%": { opacity: 1 },
        },
        "path-draw": {
          "0%": { strokeDashoffset: 1000 },
          "100%": { strokeDashoffset: 0 },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        "path-draw": "path-draw 2.2s ease-out forwards",
        shimmer: "shimmer 3.5s linear infinite",
      },
    },
  },
  plugins: [],
};
