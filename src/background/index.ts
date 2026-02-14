// DevPulse — Background Service Worker

import ExtPay from "extpay";

let extpay: any = null;

try {
  extpay = ExtPay("devpulse");
  extpay.startBackground();

  extpay
    .getUser()
    .then((user: any) => {
      chrome.storage.local.set({ isPremium: user.paid });
    })
    .catch(() => {});

  extpay.onPaid.addListener(() => {
    chrome.storage.local.set({ isPremium: true });
  });
} catch (_) {}

// ── State ────────────────────────────────────────────────────────────────

// Tabs where the script file has been injected (survives toggle)
const injectedTabs = new Set<number>();
// Tabs where the HUD is currently visible
const activeTabs = new Set<number>();

// ── Toolbar Icon Click ───────────────────────────────────────────────────

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  const tabId = tab.id;

  // Ask the content script if HUD is currently mounted
  const isActive = await isHudActive(tabId);

  if (isActive) {
    // HUD visible → hide it
    try {
      await chrome.tabs.sendMessage(tabId, { action: "destroy" });
    } catch (_) {}
    activeTabs.delete(tabId);
  } else {
    // HUD hidden → show it
    const isPremium = await getPremium();
    const url = tab.url || "";
    const isLocalhost =
      url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1");

    if (!injectedTabs.has(tabId) && !isLocalhost) {
      // Not localhost and not yet injected — inject via scripting API
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ["content/devpulse.js"],
        });
        injectedTabs.add(tabId);
      } catch (e) {
        console.error("[DevPulse BG] Injection failed:", e);
        return;
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    // Send init (script is already there — either from manifest or executeScript)
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: "init",
        isPremium,
      });
      activeTabs.add(tabId);
    } catch (e) {
      // Script not present — retry with injection
      injectedTabs.delete(tabId);
      console.warn("[DevPulse BG] Init failed, will retry:", e);
    }
  }
});

// ── Messages ─────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getState") {
    chrome.storage.local.get("isPremium", (result) => {
      sendResponse({ isPremium: result.isPremium === true });
    });
    return true;
  }

  if (msg.action === "hudClosed") {
    if (sender.tab?.id) {
      activeTabs.delete(sender.tab.id);
    }
  }

  if (msg.action === "openPayment") {
    if (extpay) extpay.openPaymentPage();
  }

  return false;
});

// ── Cleanup ──────────────────────────────────────────────────────────────

chrome.tabs.onRemoved.addListener((tabId) => {
  injectedTabs.delete(tabId);
  activeTabs.delete(tabId);
});

// Navigation clears injected state (script is gone after page load)
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    injectedTabs.delete(tabId);
    activeTabs.delete(tabId);
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────

async function getPremium(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get("isPremium");
    return result.isPremium === true;
  } catch (_) {
    return false;
  }
}

async function isHudActive(tabId: number): Promise<boolean> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: "ping" });
    return response?.active === true;
  } catch (_) {
    return false;
  }
}
