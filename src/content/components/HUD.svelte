<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { tick as collectMetrics, initObservers } from "../metrics";
  import type { MetricsSnapshot } from "../metrics";
  import MetricRow from "./MetricRow.svelte";

  // ── Props ──────────────────────────────────────────────────────────

  type Theme = "dark" | "light" | "system";

  interface Props {
    isPremium?: boolean;
    showHistory?: boolean;
    initialCollapsed?: boolean;
    initialTheme?: Theme;
    ondestroy?: () => void;
    onposchange?: (x: number, y: number) => void;
    oncollapsedchange?: (collapsed: boolean) => void;
    onthemechange?: (theme: Theme) => void;
  }

  let {
    isPremium = false,
    showHistory = true,
    initialCollapsed = false,
    initialTheme = "dark",
    ondestroy,
    onposchange,
    oncollapsedchange,
    onthemechange,
  }: Props = $props();

  // ── State ──────────────────────────────────────────────────────────

  // svelte-ignore state_referenced_locally
  let collapsed = $state(initialCollapsed);
  // svelte-ignore state_referenced_locally
  let theme = $state<Theme>(initialTheme);
  let dragging = $state(false);
  let snap: MetricsSnapshot | null = $state(null);
  let exportFlash = $state(false);

  let rafId: number | null = null;
  let dragOffset = { x: 0, y: 0 };
  let hostEl: HTMLElement | null = null;

  // ── Thresholds ─────────────────────────────────────────────────────

  const T = {
    fps: { warn: 45, danger: 30 },
    dom: { warn: 1500, danger: 3000 },
    memory: { warn: 50, danger: 100 },
    longTasks: { warn: 3, danger: 10 },
    lcp: { warn: 2500, danger: 4000 },
    fcp: { warn: 1800, danger: 3000 },
  };

  // ── Metric Help Links ─────────────────────────────────────────────

  const HELP: Record<string, string> = {
    fps: "https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame",
    dom: "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model",
    mem: "https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory",
    long: "https://web.dev/articles/long-tasks-devtools",
    net: "https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming",
    fcp: "https://web.dev/articles/fcp",
    lcp: "https://web.dev/articles/lcp",
  };

  function status(
    metric: keyof typeof T,
    value: number
  ): "ok" | "warn" | "danger" {
    const t = T[metric];
    if (metric === "fps") {
      if (value <= t.danger) return "danger";
      if (value <= t.warn) return "warn";
      return "ok";
    }
    if (value >= t.danger) return "danger";
    if (value >= t.warn) return "warn";
    return "ok";
  }

  function statusClass(s: "ok" | "warn" | "danger"): string {
    return s === "ok"
      ? "text-hud-ok"
      : s === "warn"
        ? "text-hud-warn"
        : "text-hud-danger";
  }

  // ── Formatters ─────────────────────────────────────────────────────

  function fmtBytes(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  function fmtTime(ms: number | null): string {
    if (ms === null) return "—";
    if (ms < 1000) return ms + "ms";
    return (ms / 1000).toFixed(2) + "s";
  }

  let uptime = $derived.by(() => {
    if (!snap) return "0m 0s";
    const elapsed = Math.round(performance.now() / 1000);
    return `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────

  onMount(() => {
    initObservers();
    const loop = (now: number) => {
      snap = { ...collectMetrics(now) };
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  });

  onDestroy(() => {
    if (rafId) cancelAnimationFrame(rafId);
  });

  // ── Drag ───────────────────────────────────────────────────────────

  function onDragStart(e: MouseEvent) {
    if ((e.target as HTMLElement).closest("[data-action]")) return;
    dragging = true;
    const root = (e.currentTarget as HTMLElement).getRootNode() as ShadowRoot;
    hostEl = (root?.host as HTMLElement) ?? null;
    if (hostEl) {
      const rect = hostEl.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
    }
    e.preventDefault();
  }

  function onDragMove(e: MouseEvent) {
    if (!dragging || !hostEl) return;
    const x = Math.max(0, Math.min(window.innerWidth - 50, e.clientX - dragOffset.x));
    const y = Math.max(0, Math.min(window.innerHeight - 30, e.clientY - dragOffset.y));
    hostEl.style.left = x + "px";
    hostEl.style.top = y + "px";
    hostEl.style.right = "auto";
  }

  function onDragEnd() {
    if (dragging && hostEl) {
      const rect = hostEl.getBoundingClientRect();
      onposchange?.(Math.round(rect.left), Math.round(rect.top));
      dragging = false;
      hostEl = null;
    }
  }

  onMount(() => {
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
    return () => {
      document.removeEventListener("mousemove", onDragMove);
      document.removeEventListener("mouseup", onDragEnd);
    };
  });

  // ── Actions ────────────────────────────────────────────────────────

  function toggleCollapse() {
    collapsed = !collapsed;
    oncollapsedchange?.(collapsed);
  }

  function cycleTheme() {
    const order: Theme[] = ["dark", "light", "system"];
    theme = order[(order.indexOf(theme) + 1) % order.length];
    onthemechange?.(theme);
  }

  function handleClose() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    ondestroy?.();
  }

  function handleExport() {
    if (!isPremium) {
      openPayment();
      return;
    }
    if (!snap) return;

    const snapshot = {
      url: location.href,
      timestamp: new Date().toISOString(),
      metrics: {
        fps: snap.fps,
        domNodes: snap.dom,
        memoryMB: snap.memory,
        longTasks: snap.longTasks,
        lcpMs: snap.lcp,
        fcpMs: snap.fcp,
        networkRequests: snap.netRequests,
        networkSizeBytes: snap.netSize,
      },
      history: {
        fps: [...snap.fpsHistory],
        dom: [...snap.domHistory],
        memory: [...snap.memoryHistory],
      },
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devpulse-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    exportFlash = true;
    setTimeout(() => (exportFlash = false), 600);
  }

  function openPayment() {
    try {
      chrome.runtime.sendMessage({ action: "openPayment" });
    } catch (_) {}
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class={`rounded-[10px] border border-hud-border bg-hud-bg backdrop-blur-[16px] saturate-[1.4] min-w-[220px] max-w-[280px] overflow-hidden animate-[fadeIn_0.25s_ease-out] text-[11px] leading-[1.4] text-hud-fg-dim ${dragging ? "opacity-80" : ""}`}
  style="box-shadow: var(--hud-shadow);"
>
  <!-- Header -->
  <div
    class={`flex items-center justify-between py-[7px] px-2.5 bg-hud-bg-header border-b border-hud-border cursor-grab ${collapsed ? "rounded-[10px] !border-b-0" : ""}`}
    onmousedown={onDragStart}
  >
    <div>
      <span class="text-[11px] font-bold text-hud-fg tracking-wide uppercase">DevPulse</span>
    </div>
    <div class="flex items-center gap-1">
      <!-- Theme toggle -->
      <button
        data-action="theme"
        class="w-5 h-5 flex items-center justify-center rounded text-hud-fg-muted hover:text-hud-fg transition-colors cursor-pointer"
        style="hover:background: var(--hud-btn-hover);"
        title="Theme: {theme}"
        onclick={cycleTheme}
      >
        {#if theme === "light"}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        {:else if theme === "dark"}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        {:else}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        {/if}
      </button>
      <!-- Export -->
      <button
        data-action="export"
        class={`w-5 h-5 flex items-center justify-center rounded text-hud-fg-muted hover:text-hud-fg transition-colors cursor-pointer ${exportFlash ? "!text-hud-ok" : ""}`}
        title="Export snapshot"
        onclick={handleExport}
      >
        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 1v6M2 4l3-3 3 3M1 8h8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <!-- Separator -->
       <div class="p-1"></div>
      <!-- Collapse -->
      <button
        data-action="collapse"
        class="w-5 h-5 flex items-center justify-center rounded text-hud-fg-muted hover:text-hud-fg transition-colors cursor-pointer"
        title="Collapse"
        onclick={toggleCollapse}
      >
        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 4h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
      <!-- Close -->
      <button
        data-action="close"
        class="w-5 h-5 flex items-center justify-center rounded text-hud-fg-muted hover:text-hud-danger transition-colors cursor-pointer"
        title="Close"
        onclick={handleClose}
      >
        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>
  </div>

  <!-- Body (expanded) -->
  {#if !collapsed && snap}
    <div class="py-2 px-2.5">
      <MetricRow
        label="FPS"
        value={String(snap.fps)}
        status={status("fps", snap.fps)}
        history={snap.fpsHistory}
        helpUrl={HELP.fps}
        {showHistory}
      />
      <MetricRow
        label="DOM"
        value={snap.dom.toLocaleString()}
        status={status("dom", snap.dom)}
        history={snap.domHistory}
        helpUrl={HELP.dom}
        {showHistory}
      />

      {#if (performance as any).memory}
        <MetricRow
          label="MEM"
          value={snap.memory + " MB"}
          status={status("memory", snap.memory)}
          history={snap.memoryHistory}
          helpUrl={HELP.mem}
          {showHistory}
          locked={!isPremium}
          onunlock={openPayment}
        />
      {/if}
      <MetricRow
        label="LONG"
        value={snap.longTasks +
          (snap.longTasksRecent > 0
            ? ` <span style="display:inline-block;font-size:9px;font-weight:700;padding:0 4px;border-radius:3px;background:color-mix(in srgb,var(--hud-danger) 20%,transparent);color:var(--hud-danger);margin-left:2px">+${snap.longTasksRecent}</span>`
            : "")}
        status={status("longTasks", snap.longTasks)}
        helpUrl={HELP.long}
        locked={!isPremium}
        onunlock={openPayment}
      />
      <MetricRow
        label="NET"
        value={`${snap.netRequests} req · ${fmtBytes(snap.netSize)}`}
        helpUrl={HELP.net}
        locked={!isPremium}
        onunlock={openPayment}
      />

      <!-- Vitals -->
      {#if snap.fcp !== null || snap.lcp !== null}
        <div class="flex gap-3 pt-1.5 mt-1 border-t border-hud-border">
          {#if snap.fcp !== null}
            {#if isPremium}
              <div class="flex items-center gap-1">
                <span class="text-[9px] font-bold tracking-wider text-hud-fg-muted">FCP</span>
                <a href={HELP.fcp} target="_blank" rel="noopener noreferrer" class="flex items-center justify-center w-3 h-3 rounded-full text-hud-fg-muted opacity-40 hover:opacity-100 transition-opacity cursor-pointer" title="Learn more about FCP" onclick={(e: MouseEvent) => e.stopPropagation()}>
                  <svg width="7" height="7" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3.5a.75.75 0 0 1 1.5 0v.5a.75.75 0 0 1-1.5 0v-.5ZM8 7a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 7Z"/></svg>
                </a>
                <span class={`text-[11px] font-semibold tabular-nums ${statusClass(status("fcp", snap.fcp))}`}>{fmtTime(snap.fcp)}</span>
              </div>
            {:else}
              <div class="flex items-center gap-1">
                <span class="text-[9px] font-bold tracking-wider text-hud-fg-muted">FCP</span>
                <button class="text-[8px] font-bold uppercase tracking-wider text-hud-pro bg-hud-pro-bg px-1.5 py-px rounded cursor-pointer hover:opacity-80 transition-opacity" onclick={openPayment}>PRO</button>
              </div>
            {/if}
          {/if}

          {#if snap.lcp !== null}
            {#if isPremium}
              <div class="flex items-center gap-1">
                <span class="text-[9px] font-bold tracking-wider text-hud-fg-muted">LCP</span>
                <a href={HELP.lcp} target="_blank" rel="noopener noreferrer" class="flex items-center justify-center w-3 h-3 rounded-full text-hud-fg-muted opacity-40 hover:opacity-100 transition-opacity cursor-pointer" title="Learn more about LCP" onclick={(e: MouseEvent) => e.stopPropagation()}>
                  <svg width="7" height="7" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3.5a.75.75 0 0 1 1.5 0v.5a.75.75 0 0 1-1.5 0v-.5ZM8 7a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 7Z"/></svg>
                </a>
                <span class={`text-[11px] font-semibold tabular-nums ${statusClass(status("lcp", snap.lcp))}`}>{fmtTime(snap.lcp)}</span>
              </div>
            {:else}
              <div class="flex items-center gap-1">
                <span class="text-[9px] font-bold tracking-wider text-hud-fg-muted">LCP</span>
                <button class="text-[8px] font-bold uppercase tracking-wider text-hud-pro bg-hud-pro-bg px-1.5 py-px rounded cursor-pointer hover:opacity-80 transition-opacity" onclick={openPayment}>PRO</button>
              </div>
            {/if}
          {/if}
        </div>
      {/if}

      <!-- Footer -->
      <div class="pt-1 mt-1 flex justify-center">
        <span class="text-[9px] text-hud-fg-muted tracking-wide">
          {uptime}
        </span>
      </div>
    </div>
  {/if}

  <!-- Collapsed bar -->
  {#if collapsed && snap}
    <div
      class="flex items-center gap-1 py-1.5 px-2.5 cursor-pointer"
      onclick={toggleCollapse}
    >
      <span class={`text-[10px] font-semibold tabular-nums ${statusClass(status("fps", snap.fps))}`}>
        {snap.fps} FPS
      </span>
      <span class="text-[10px] text-hud-fg-muted mx-px">·</span>
      <span class={`text-[10px] font-semibold tabular-nums ${statusClass(status("dom", snap.dom))}`}>
        {snap.dom.toLocaleString()} DOM
      </span>
      {#if snap.memory}
        <span class="text-[10px] text-hud-fg-muted mx-px">·</span>
        <span class="text-[10px] font-semibold tabular-nums text-hud-fg">
          {snap.memory}MB
        </span>
      {/if}
    </div>
  {/if}
</div>

<style>
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>