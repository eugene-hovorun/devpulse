/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/content/**/*.{svelte,ts}"],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          "SF Mono",
          "JetBrains Mono",
          "Cascadia Code",
          "Fira Code",
          "ui-monospace",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
