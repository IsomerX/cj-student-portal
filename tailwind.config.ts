import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const colorVar = (name: string) => `var(${name})`;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: colorVar("--border"),
        input: colorVar("--input"),
        ring: colorVar("--ring"),
        background: colorVar("--background"),
        foreground: colorVar("--foreground"),
        primary: {
          DEFAULT: colorVar("--primary"),
          foreground: colorVar("--primary-foreground"),
        },
        secondary: {
          DEFAULT: colorVar("--secondary"),
          foreground: colorVar("--secondary-foreground"),
        },
        destructive: {
          DEFAULT: colorVar("--destructive"),
          foreground: colorVar("--destructive-foreground"),
        },
        muted: {
          DEFAULT: colorVar("--muted"),
          foreground: colorVar("--muted-foreground"),
        },
        accent: {
          DEFAULT: colorVar("--accent"),
          foreground: colorVar("--accent-foreground"),
        },
        popover: {
          DEFAULT: colorVar("--popover"),
          foreground: colorVar("--popover-foreground"),
        },
        card: {
          DEFAULT: colorVar("--card"),
          foreground: colorVar("--card-foreground"),
        },
        success: {
          DEFAULT: colorVar("--success"),
          foreground: colorVar("--success-foreground"),
        },
        warning: {
          DEFAULT: colorVar("--warning"),
          foreground: colorVar("--warning-foreground"),
        },
        info: {
          DEFAULT: colorVar("--info"),
          foreground: colorVar("--info-foreground"),
        },
        placeholder: colorVar("--placeholder"),
        "notification-badge": {
          DEFAULT: colorVar("--notification-badge"),
          foreground: colorVar("--notification-badge-foreground"),
        },
        brand: {
          DEFAULT: colorVar("--brand"),
          foreground: colorVar("--brand-foreground"),
          light: colorVar("--brand-light"),
          "light-2": colorVar("--brand-light-2"),
          dark: colorVar("--brand-dark"),
          subtitle: colorVar("--brand-subtitle"),
          depth: colorVar("--brand-depth"),
        },
        "surface-muted": colorVar("--surface-muted"),
        "error-background": colorVar("--error-background"),
        "success-background": colorVar("--success-background"),
        "warning-background": colorVar("--warning-background"),
        "info-background": colorVar("--info-background"),
        "accent-background": colorVar("--accent-background"),
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        heading: "1.625rem",
        subtitle: "1rem",
        button: "1.125rem",
        small: "0.875rem",
        xxxlarge: "2rem",
        xxlarge: "1.75rem",
        xlarge: "1.5rem",
        large: "1.25rem",
        medium: "1.125rem",
        regular: "1rem",
        xsmall: "0.75rem",
        xxsmall: "0.6875rem",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        large: "0.75rem",
        xlarge: "1rem",
        xxlarge: "1.25rem",
      },
      boxShadow: {
        card: "2px 2px 0 var(--primary)",
        "card-large": "3px 3px 0 var(--primary)",
        "button-default": "3px 3px 0 rgb(0 0 0 / 0.25)",
        "button-pressed": "1px 1px 0 rgb(0 0 0 / 0.25)",
        "back-button": "0 2px 4px 0 rgb(0 0 0 / 0.1)",
        soft: "0 2px 8px 0 rgb(0 0 0 / 0.1)",
      },
      keyframes: {
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "ping-slow": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "75%, 100%": { transform: "scale(1.5)", opacity: "0" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "pulse-slow": "pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow": "ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;
