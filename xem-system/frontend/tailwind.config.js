/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // E-ink inspired B&W color palette
        primary: {
          DEFAULT: "#000000", // Pure black
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#4A4A4A", // Dark gray
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#1A1A1A", // Near black
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#666666", // Medium gray
          foreground: "#FFFFFF",
        },
        danger: {
          DEFAULT: "#2D2D2D", // Charcoal
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F5F5F5", // Off-white
          foreground: "#404040",
        },
        // E-ink grayscale levels
        ink: {
          0: "#FFFFFF",  // White (paper)
          1: "#F0F0F0",  // Lightest gray
          2: "#E0E0E0",  // Very light gray
          3: "#D0D0D0",  // Light gray
          4: "#B0B0B0",  // Medium-light gray
          5: "#909090",  // Medium gray
          6: "#707070",  // Medium-dark gray
          7: "#505050",  // Dark gray
          8: "#303030",  // Very dark gray
          9: "#000000",  // Black (ink)
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
};
