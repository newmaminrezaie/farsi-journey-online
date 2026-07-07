import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1360px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          soft: "hsl(var(--primary-soft))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          foreground: "hsl(var(--gold-foreground))",
        },
        turquoise: {
          DEFAULT: "hsl(var(--turquoise))",
          foreground: "hsl(var(--turquoise-foreground))",
        },
        parchment: "hsl(var(--parchment))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      fontFamily: {
        sans: ['"Vazirmatn Variable"', "Vazirmatn", "system-ui", "sans-serif"],
        display: ['"Estedad"', '"Vazirmatn Variable"', "serif"],
      },
      fontSize: {
        "display-sm": ["2.5rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "display": ["3.75rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-lg": ["5rem", { lineHeight: "1.02", letterSpacing: "-0.025em" }],
        "display-xl": ["6.5rem", { lineHeight: "0.98", letterSpacing: "-0.03em" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "navy": "0 20px 45px -20px hsl(var(--primary) / 0.35)",
        "gold": "0 15px 40px -15px hsl(var(--gold) / 0.4)",
        "soft": "0 2px 20px -4px hsl(var(--primary) / 0.08)",
      },
      backgroundImage: {
        "tile-navy": "var(--tile-navy)",
        "tile-gold": "var(--tile-gold)",
        "grad-hero": "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(220 65% 20%) 100%)",
        "grad-gold": "linear-gradient(135deg, hsl(var(--gold)) 0%, hsl(38 85% 55%) 100%)",
      },
      keyframes: {
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
        "shimmer": "shimmer 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
