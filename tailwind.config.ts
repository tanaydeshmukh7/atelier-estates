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
        limestone: {
          50: "#FAF7F2",
          100: "#F3EDE3", // Brand primary background
          200: "#ECE3D4",
          300: "#E3D5C0",
          400: "#D4C2A7",
          500: "#C2AC8F",
        },
        charcoal: {
          950: "#141310",
          900: "#1C1A15",
          800: "#292720", // Brand primary text & deep surfaces
          700: "#3E3B32",
          600: "#555146",
          500: "#746F60",
          400: "#989280",
          300: "#BCB6A5",
        },
        terracotta: {
          DEFAULT: "#A65D3B", // Brand accent
          dark: "#8B4B2D",
          light: "#C07553",
          soft: "#F2E5DF",
        },
        sandstone: {
          DEFAULT: "#D8C8B2", // Brand secondary surface/border
          dark: "#C3B096",
          light: "#E7DCServer",
          tint: "#EFE8DC",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Cinzel", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      letterSpacing: {
        widestEditorial: "0.25em",
        wideEditorial: "0.15em",
      },
      boxShadow: {
        soft: "0 20px 40px -15px rgba(41, 39, 32, 0.08)",
        elevation: "0 30px 60px -20px rgba(41, 39, 32, 0.12)",
        subtle: "0 4px 20px -2px rgba(41, 39, 32, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
