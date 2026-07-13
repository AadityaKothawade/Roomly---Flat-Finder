/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        parchment: "rgb(var(--color-parchment) / <alpha-value>)",
        moss: "rgb(var(--color-moss) / <alpha-value>)",
        clay: "rgb(var(--color-clay) / <alpha-value>)",
        brass: "rgb(var(--color-brass) / <alpha-value>)",
        linen: "rgb(var(--color-linen) / <alpha-value>)",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "6px",
        lg: "10px",
        xl: "14px",
      },
      boxShadow: {
        soft: "0 2px 12px rgb(var(--color-ink) / 0.06)",
        card: "0 4px 20px rgb(var(--color-ink) / 0.08)",
      },
    },
  },
  plugins: [],
};