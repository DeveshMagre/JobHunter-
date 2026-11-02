/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#182230",
        muted: "#667085",
        line: "#eaecf0",
        canvas: "#f8f9fb",
        brand: {
          DEFAULT: "#635bff",
          dark: "#5148e5",
          soft: "#f0efff",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)",
      },
    },
  },
  plugins: [],
};
