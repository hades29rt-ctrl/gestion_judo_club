/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#14213D",
          light: "#1F3A63",
          dark: "#0D1628",
        },
        gold: {
          DEFAULT: "#C9A15A",
          light: "#DDC08A",
          dark: "#A6813F",
        },
        surface: "#FAFAF8",
        card: "#FFFFFF",
        border: "#E5E3DD",
        ink_text: "#1A1A1A",
        muted: "#6B6B65",
        danger: "#B3261E",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
