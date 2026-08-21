/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        logoca: {
          primary: "#0d3b66",
          secondary: "#f4a261",
          accent: "#2a9d8f",
          danger: "#e63946",
          warning: "#f4a261",
          light: "#f8f9fa",
          dark: "#212529",
        },
        brand: {
          brahma: "#c8102e",
          pepsi: "#004b93",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
