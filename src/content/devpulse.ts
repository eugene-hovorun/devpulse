// DevPulse — Content Script Entry
// Shadow DOM on a plain <div>, no customElements API needed

import { mount, unmount } from "svelte";
import HUD from "./components/HUD.svelte";
import styles from "./hud.css?inline";

let svelteApp: ReturnType<typeof mount> | null = null;
let hostElement: HTMLDivElement | null = null;

const KEYS = {
  active: "devpulse_active",
  pos: "devpulse_pos",
  collapsed: "devpulse_collapsed",
};

function loadPos(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(KEYS.pos);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function loadCollapsed(): boolean {
  try {
    return localStorage.getItem(KEYS.collapsed) === "true";
  } catch (_) {}
  return false;
}

function create(isPremium: boolean) {
  if (hostElement) destroy();

  const savedPos = loadPos();

  hostElement = document.createElement("div");
  hostElement.id = "devpulse-root";

  const posCSS = savedPos
    ? `left:${savedPos.x}px;top:${savedPos.y}px;`
    : `top:12px;right:12px;`;

  hostElement.style.cssText = `all:initial;position:fixed;${posCSS}z-index:2147483647;pointer-events:auto;font-family:ui-monospace,monospace;`;

  const shadow = hostElement.attachShadow({ mode: "closed" });

  const styleEl = document.createElement("style");
  styleEl.textContent = styles;
  shadow.appendChild(styleEl);

  const target = document.createElement("div");
  shadow.appendChild(target);

  document.documentElement.appendChild(hostElement);

  svelteApp = mount(HUD, {
    target,
    props: {
      isPremium,
      showHistory: true,
      initialCollapsed: loadCollapsed(),
      ondestroy: () => destroy(),
      onposchange: (x: number, y: number) => {
        try {
          localStorage.setItem(KEYS.pos, JSON.stringify({ x, y }));
        } catch (_) {}
      },
      oncollapsedchange: (val: boolean) => {
        try {
          localStorage.setItem(KEYS.collapsed, String(val));
        } catch (_) {}
      },
    },
  });

  try {
    localStorage.setItem(KEYS.active, "true");
  } catch (_) {}
}

function destroy() {
  if (svelteApp) {
    try {
      unmount(svelteApp);
    } catch (_) {}
    svelteApp = null;
  }

  if (hostElement) {
    hostElement.remove();
    hostElement = null;
  }

  try {
    localStorage.removeItem(KEYS.active);
  } catch (_) {}

  try {
    chrome.runtime.sendMessage({ action: "hudClosed" });
  } catch (_) {}
}

// ── Message Listener ───────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "init") {
    create(msg.isPremium ?? false);
  }
  if (msg.action === "destroy") {
    destroy();
  }
});

// ── Localhost Auto-Restore ─────────────────────────────────────────────

const isLocalhost =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";

if (isLocalhost) {
  try {
    if (localStorage.getItem(KEYS.active) === "true") {
      chrome.runtime.sendMessage({ action: "getState" }, (response) => {
        if (chrome.runtime.lastError) {
          localStorage.removeItem(KEYS.active);
          return;
        }
        create(response?.isPremium ?? false);
      });
    }
  } catch (_) {}
}
