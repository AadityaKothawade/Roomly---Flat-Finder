/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12213A",       // deep navy — headings, primary actions
        parchment: "#F6F1E7", // warm off-white background
        moss: "#3F6B4E",      // trust/match-positive accent
        clay: "#B5583A",      // low-match / warning accent
        brass: "#B08D57",     // secondary accent, dividers
        linen: "#EDE6D6",     // card surfaces
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "6px",
      },
    },
  },
  plugins: [],
};
