/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/content/**/*.{svelte,ts}"],
  theme: {
    extend: {
      colors: {
        hud: {
          bg: "var(--hud-bg)",
          "bg-header": "var(--hud-bg-header)",
          fg: "var(--hud-fg)",
          "fg-dim": "var(--hud-fg-dim)",
          "fg-muted": "var(--hud-fg-muted)",
          border: "var(--hud-border)",
          "border-subtle": "var(--hud-border-subtle)",
          ok: "var(--hud-ok)",
          warn: "var(--hud-warn)",
          danger: "var(--hud-danger)",
          pro: "var(--hud-pro)",
          "pro-bg": "var(--hud-pro-bg)",
          locked: "var(--hud-locked)",
        },
      },
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
