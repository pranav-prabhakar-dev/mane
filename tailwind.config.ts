import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-lora)", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        // Warm orange accent
        brand: {
          50: "#FFF5EC",
          100: "#FFE6D1",
          200: "#FFCBA0",
          300: "#FFA96A",
          400: "#F7873F",
          500: "#EB6A1F",
          600: "#CC5413",
          700: "#A34110",
          800: "#7A3210",
          900: "#582510",
        },
        // Off-white + pleasant warm greys (light mode)
        surface: {
          DEFAULT: "#F6F3EE", // page background (warm off-white)
          raised: "#FBF9F5", // cards
          sunken: "#EDE9E2", // wells / subtle panels
          border: "#E2DDD3",
          muted: "#8A8579",
          text: "#2A2823",
          subtle: "#6B665C",
        },
        // Dark mode palette
        night: {
          DEFAULT: "#1B1A17",
          raised: "#242320",
          sunken: "#141310",
          border: "#33312C",
          muted: "#8F8A7F",
          text: "#EFEAE0",
          subtle: "#B4AEA1",
        },
      },
      boxShadow: {
        tile: "0 1px 2px rgba(24,22,18,0.04), 0 4px 16px rgba(24,22,18,0.05)",
        tileHover:
          "0 2px 4px rgba(24,22,18,0.06), 0 10px 28px rgba(24,22,18,0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
