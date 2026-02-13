// DevPulse — Content Script Entry
// Shadow DOM on a plain <div>, no customElements API needed

import { mount, unmount } from "svelte";
import HUD from "./components/HUD.svelte";
import styles from "./hud.css?inline";

let svelteApp: ReturnType<typeof mount> | null = null;
let hostElement: HTMLDivElement | null = null;

function create(isPremium: boolean) {
  if (hostElement) destroy();

  hostElement = document.createElement("div");
  hostElement.id = "devpulse-root";
  hostElement.style.cssText =
    "all:initial;position:fixed;top:12px;right:12px;z-index:2147483647;pointer-events:auto;font-family:ui-monospace,monospace;";

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
      ondestroy: () => destroy(),
    },
  });

  try {
    localStorage.setItem("devpulse_active", "true");
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
    localStorage.removeItem("devpulse_active");
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
    if (localStorage.getItem("devpulse_active") === "true") {
      chrome.runtime.sendMessage({ action: "getState" }, (response) => {
        if (chrome.runtime.lastError) {
          localStorage.removeItem("devpulse_active");
          return;
        }
        create(response?.isPremium ?? false);
      });
    }
  } catch (_) {}
}
