import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7C83FD",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#B8A8FF",
          foreground: "#1A1A1A",
        },
        accent: {
          DEFAULT: "#B8F2D0",
          foreground: "#1A1A1A",
        },
        success: {
          DEFAULT: "#A8E6A1",
          foreground: "#1A1A1A",
        },
        warning: {
          DEFAULT: "#FFE5A3",
          foreground: "#1A1A1A",
        },
        danger: {
          DEFAULT: "#FFB5B5",
          foreground: "#1A1A1A",
        },
        background: "#FAFAFC",
        card: "#FFFFFF",
        foreground: "#1A1A1A",
        muted: {
          DEFAULT: "#F4F4F6",
          foreground: "#6B7280",
        },
        border: "#EAEAEA",
        input: "#EAEAEA",
        ring: "#7C83FD",
        destructive: {
          DEFAULT: "#FFB5B5",
          foreground: "#1A1A1A",
        },
      },
      borderRadius: {
        lg: "0.625rem",
        md: "calc(0.625rem - 2px)",
        sm: "calc(0.625rem - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
