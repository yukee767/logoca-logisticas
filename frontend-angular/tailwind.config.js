/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,css,scss}",
    "./src/**/*.html",
    "./src/**/*.ts"
  ],
  theme: {
    extend: {
      colors: {
        logoca: {
          navy: "#0f2140",
          navyLight: "#1a3a6b",
          navyDark: "#0a1830",
          orange: "#ff6b00",
          orangeLight: "#ff8c33",
          orangeDark: "#e56000",
          gray: "#f4f6f9",
          grayDark: "#6b7280"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "sans-serif"]
      },
      boxShadow: {
        card: "0 4px 24px rgba(15,33,64,0.08)",
        cardHover: "0 12px 32px rgba(15,33,64,0.14)"
      }
    }
  },
  plugins: []
};
