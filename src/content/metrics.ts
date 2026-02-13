// Reactive metrics state — collected via browser APIs

export interface MetricsSnapshot {
  fps: number;
  fpsHistory: number[];
  dom: number;
  domHistory: number[];
  memory: number;
  memoryHistory: number[];
  cls: number;
  longTasks: number;
  longTasksRecent: number;
  lcp: number | null;
  fcp: number | null;
  netRequests: number;
  netSize: number;
}

const HISTORY_MAX = 60;

// Internal mutable state
let fpsFrames = 0;
let fpsLastTime = performance.now();
let domLastCheck = 0;
let memLastCheck = 0;
let netLastCheck = 0;

const state: MetricsSnapshot = {
  fps: 0,
  fpsHistory: [],
  dom: 0,
  domHistory: [],
  memory: 0,
  memoryHistory: [],
  cls: 0,
  longTasks: 0,
  longTasksRecent: 0,
  lcp: null,
  fcp: null,
  netRequests: 0,
  netSize: 0,
};

// ── Tick-based collectors (called in rAF loop) ─────────────────────────

export function tick(now: number): MetricsSnapshot {
  // FPS
  fpsFrames++;
  if (now - fpsLastTime >= 1000) {
    state.fps = fpsFrames;
    pushHistory(state.fpsHistory, fpsFrames);
    fpsFrames = 0;
    fpsLastTime = now;
  }

  // DOM count (1s throttle)
  if (now - domLastCheck >= 1000) {
    domLastCheck = now;
    state.dom = document.querySelectorAll("*").length;
    pushHistory(state.domHistory, state.dom);
  }

  // Memory (2s throttle)
  if (now - memLastCheck >= 2000) {
    memLastCheck = now;
    const mem = (performance as any).memory;
    if (mem) {
      state.memory = Math.round(mem.usedJSHeapSize / 1048576);
      pushHistory(state.memoryHistory, state.memory);
    }
  }

  // Network (2s throttle)
  if (now - netLastCheck >= 2000) {
    netLastCheck = now;
    const entries = performance.getEntriesByType("resource");
    state.netRequests = entries.length;
    state.netSize = entries.reduce(
      (sum, e) => sum + ((e as PerformanceResourceTiming).transferSize || 0),
      0
    );
  }

  return state;
}

// ── Observer-based collectors (set up once) ────────────────────────────

export function initObservers(): void {
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          state.cls += (entry as any).value;
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch (_) {}

  try {
    new PerformanceObserver((list) => {
      const count = list.getEntries().length;
      state.longTasks += count;
      state.longTasksRecent += count;
      setTimeout(() => {
        state.longTasksRecent = Math.max(0, state.longTasksRecent - count);
      }, 5000);
    }).observe({ type: "longtask", buffered: true });
  } catch (_) {}

  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        state.lcp = Math.round(entries[entries.length - 1].startTime);
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch (_) {}

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          state.fcp = Math.round(entry.startTime);
        }
      }
    }).observe({ type: "paint", buffered: true });
  } catch (_) {}
}

function pushHistory(arr: number[], value: number): void {
  arr.push(value);
  if (arr.length > HISTORY_MAX) arr.shift();
}
