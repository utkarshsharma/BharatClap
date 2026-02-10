/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF6B00",
          50: "#FFF3E0",
          100: "#FFE0B2",
          200: "#FFCC80",
          300: "#FFB74D",
          400: "#FFA726",
          500: "#FF6B00",
          600: "#F57C00",
          700: "#EF6C00",
          800: "#E65100",
          900: "#D84315",
        },
        secondary: {
          DEFAULT: "#1A1A2E",
          50: "#E8E8ED",
          100: "#C4C4D1",
          200: "#9D9DB3",
          300: "#767695",
          400: "#58587E",
          500: "#3A3A67",
          600: "#34345F",
          700: "#2C2C54",
          800: "#25254A",
          900: "#1A1A2E",
        },
        accent: "#FFF3E0",
        background: "#FFFFFF",
        text: "#1A1A2E",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
