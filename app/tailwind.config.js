/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "on-secondary-fixed": "#2a1700",
        "on-surface": "#e4e1e9",
        "tertiary": "#4edea3",
        "inverse-surface": "#e4e1e9",
        "primary-fixed": "#e9ddff",
        "surface-variant": "#35343a",
        "on-primary-fixed-variant": "#5516be",
        "on-secondary-container": "#5b3800",
        "outline": "#958ea0",
        "tertiary-container": "#00a572",
        "on-background": "#e4e1e9",
        "primary": "#d0bcff",
        "surface-container-highest": "#35343a",
        "inverse-primary": "#6d3bd7",
        "background": "#131318",
        "on-tertiary-container": "#00311f",
        "surface-container": "#1f1f25",
        "inverse-on-surface": "#303036",
        "surface-container-lowest": "#0e0e13",
        "surface-tint": "#d0bcff",
        "on-error-container": "#ffdad6",
        "on-surface-variant": "#cbc3d7",
        "on-primary-container": "#340080",
        "on-tertiary-fixed-variant": "#005236",
        "on-secondary-fixed-variant": "#653e00",
        "on-secondary": "#472a00",
        "tertiary-fixed": "#6ffbbe",
        "on-tertiary-fixed": "#002113",
        "on-error": "#690005",
        "primary-fixed-dim": "#d0bcff",
        "tertiary-fixed-dim": "#4edea3",
        "surface": "#131318",
        "secondary-fixed-dim": "#ffb95f",
        "secondary-fixed": "#ffddb8",
        "secondary-container": "#ee9800",
        "primary-container": "#a078ff",
        "on-primary-fixed": "#23005c",
        "secondary": "#ffb95f",
        "surface-container-high": "#2a292f",
        "surface-bright": "#39383e",
        "outline-variant": "#494454",
        "surface-container-low": "#1b1b20",
        "error": "#ffb4ab",
        "on-tertiary": "#003824",
        "error-container": "#93000a",
        "surface-dim": "#131318",
        "on-primary": "#3c0091"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "1.5rem",
        "md": "0.75rem",
        "full": "9999px"
      },
      fontFamily: {
        "headline": ["Manrope", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      }
    }
  },
  plugins: [],
}
