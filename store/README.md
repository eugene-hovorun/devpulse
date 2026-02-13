# ⚡ DevPulse

Real-time performance HUD for web developers. Monitor FPS, DOM nodes, memory, CLS, and Core Web Vitals — right on the page.

## Features

| Metric | Free | Pro |
|--------|------|-----|
| FPS + sparkline | ✅ | ✅ |
| DOM node count + sparkline | ✅ | ✅ |
| JS heap memory | — | ✅ |
| Cumulative Layout Shift | — | ✅ |
| Long Tasks | — | ✅ |
| Network requests + size | — | ✅ |
| FCP / LCP | — | ✅ |
| JSON export | — | ✅ |

**Plus:** draggable HUD, collapse mode, dark/light/system theme, localhost persistence, shadow DOM isolation.

## Development

```bash
npm install
npm run build     # builds to dist/
npm run zip       # builds + zips for Chrome Web Store
```

Load unpacked from `dist/` in `chrome://extensions` (enable Developer Mode).

## Architecture

```
src/
├── background/index.ts     # Service worker — ExtPay, injection, messaging
├── content/
│   ├── devpulse.ts         # Entry — shadow DOM host, state persistence
│   ├── metrics.ts          # Performance collectors (rAF + PerformanceObserver)
│   ├── hud.css             # Tailwind + CSS vars (dark/light themes)
│   └── components/
│       ├── HUD.svelte      # Main overlay component
│       ├── MetricRow.svelte # Metric display row
│       └── Sparkline.svelte # SVG sparkline
```

**No popup.** Toolbar icon click → background injects/toggles HUD directly on the page.

## Tech Stack

Svelte 5 · Tailwind CSS 3 · Vite · TypeScript · Chrome MV3 · ExtensionPay

## License

MIT
