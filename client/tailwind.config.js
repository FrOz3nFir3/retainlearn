/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,html}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#4F46E5",   // rich indigo (from logo top)
          accent:  "#F59E0B",   // amber-500 — deeper, richer than amber-400
          light:   "#FAF8F4",   // warm off-white (slightly warmer than pure white)
          dark:    "#1E1B4B",   // deep indigo (hero + footer bg)
          muted:   "#6366F1",   // indigo-500 for subtle elements
          surface: "#FEF3C7",   // amber-100 for light tinted surfaces
        },
      },
      fontFamily: {
        sans:    ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        heading: ['"Fraunces"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
