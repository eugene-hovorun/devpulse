<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { tick as collectMetrics, initObservers } from "../metrics";
  import type { MetricsSnapshot } from "../metrics";
  import MetricRow from "./MetricRow.svelte";
  import Sparkline from "./Sparkline.svelte";

  // ── Props ──────────────────────────────────────────────────────────

  interface Props {
    isPremium?: boolean;
    showHistory?: boolean;
    ondestroy?: () => void;
  }

  let { isPremium = false, showHistory = true, ondestroy }: Props = $props();

  // ── State ──────────────────────────────────────────────────────────

  let collapsed = $state(false);
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
    cls: { warn: 0.1, danger: 0.25 },
    longTasks: { warn: 3, danger: 10 },
    lcp: { warn: 2500, danger: 4000 },
    fcp: { warn: 1800, danger: 3000 },
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
    // Trigger recalc whenever snap updates
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
    hostEl = root?.host as HTMLElement ?? null;
    if (hostEl) {
      const rect = hostEl.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
    }
    e.preventDefault();
  }

  function onDragMove(e: MouseEvent) {
    if (!dragging || !hostEl) return;
    const x = Math.max(
      0,
      Math.min(window.innerWidth - 50, e.clientX - dragOffset.x)
    );
    const y = Math.max(
      0,
      Math.min(window.innerHeight - 30, e.clientY - dragOffset.y)
    );
    hostEl.style.left = x + "px";
    hostEl.style.top = y + "px";
    hostEl.style.right = "auto";
  }

  function onDragEnd() {
    if (dragging) {
      dragging = false;
      hostEl = null;
    }
  }

  // Attach document-level drag listeners
  onMount(() => {
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
    return () => {
      document.removeEventListener("mousemove", onDragMove);
      document.removeEventListener("mouseup", onDragEnd);
    };
  });

  // ── Actions ────────────────────────────────────────────────────────

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
        cls: snap.cls,
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
  class="rounded-[10px] border border-white/[0.08] bg-[#0d0d11]/[0.94] backdrop-blur-[16px] saturate-[1.4] shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.03),inset_0_1px_0_rgba(255,255,255,0.04)] min-w-[220px] max-w-[280px] overflow-hidden animate-[fadeIn_0.25s_ease-out] text-[11px] leading-[1.4] text-[#c8cad4]"
  class:opacity-80={dragging}
>
  <!-- Header -->
  <div
    class="flex items-center justify-between py-[7px] px-2.5 bg-[#14141c]/[0.98] border-b border-white/[0.08] cursor-grab"
    class:!border-b-0={collapsed}
    class:rounded-[10px]={collapsed}
    class:!rounded-b-none={!collapsed}
    onmousedown={onDragStart}
  >
    <div class="flex items-center gap-[5px]">
      <span class="text-xs leading-none">⚡</span>
      <span class="text-[11px] font-bold text-[#ebedf5] tracking-wide uppercase"
        >DevPulse</span
      >
    </div>
    <div class="flex items-center gap-1">
      <button
        data-action="collapse"
        class="w-5 h-5 flex items-center justify-center rounded text-[#6b6e80] hover:bg-white/[0.08] hover:text-[#ebedf5] transition-colors cursor-pointer"
        title="Collapse"
        onclick={() => (collapsed = !collapsed)}
      >
        <svg width="10" height="10" viewBox="0 0 10 10"
          ><path
            d="M1 4h8"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          /></svg
        >
      </button>
      <button
        data-action="export"
        class={`w-5 h-5 flex items-center justify-center rounded text-[#6b6e80] hover:bg-white/[0.08] hover:text-[#ebedf5] transition-colors cursor-pointer ${
          exportFlash ? "!bg-[#52c41a]/25 !text-[#52c41a]" : ""
        }`}
        title="Export snapshot"
        onclick={handleExport}
      >
        <svg width="10" height="10" viewBox="0 0 10 10"
          ><path
            d="M5 1v6M2 4l3-3 3 3M1 8h8"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          /></svg
        >
      </button>
      <button
        data-action="close"
        class="w-5 h-5 flex items-center justify-center rounded text-[#6b6e80] hover:bg-[#ff4d4f]/20 hover:text-[#ff4d4f] transition-colors cursor-pointer"
        title="Close"
        onclick={handleClose}
      >
        <svg width="10" height="10" viewBox="0 0 10 10"
          ><path
            d="M2 2l6 6M8 2l-6 6"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          /></svg
        >
      </button>
    </div>
  </div>

  <!-- Body (expanded) -->
  {#if !collapsed && snap}
    <div class="py-2 px-2.5">
      <!-- Free metrics -->
      <MetricRow
        label="FPS"
        value={String(snap.fps)}
        status={status("fps", snap.fps)}
        history={snap.fpsHistory}
        {showHistory}
      />
      <MetricRow
        label="DOM"
        value={snap.dom.toLocaleString()}
        status={status("dom", snap.dom)}
        history={snap.domHistory}
        {showHistory}
      />

      <!-- Premium metrics -->
      {#if (performance as any).memory}
        <MetricRow
          label="MEM"
          value={snap.memory + " MB"}
          status={status("memory", snap.memory)}
          history={snap.memoryHistory}
          {showHistory}
          locked={!isPremium}
          onunlock={openPayment}
        />
      {/if}
      <MetricRow
        label="CLS"
        value={snap.cls.toFixed(4)}
        status={status("cls", snap.cls)}
        locked={!isPremium}
        onunlock={openPayment}
      />
      <MetricRow
        label="LONG"
        value={snap.longTasks +
          (snap.longTasksRecent > 0
            ? ` <span class="inline-block text-[9px] font-bold px-1 rounded bg-[#ff4d4f]/20 text-[#ff4d4f] ml-0.5">+${snap.longTasksRecent}</span>`
            : "")}
        status={status("longTasks", snap.longTasks)}
        locked={!isPremium}
        onunlock={openPayment}
      />
      <MetricRow
        label="NET"
        value={`${snap.netRequests} req · ${fmtBytes(snap.netSize)}`}
        locked={!isPremium}
        onunlock={openPayment}
      />

      <!-- Vitals -->
      {#if snap.fcp !== null || snap.lcp !== null}
        <div
          class="flex gap-2 pt-1.5 mt-1 border-t border-white/[0.08]"
        >
          {#if snap.fcp !== null}
            {#if isPremium}
              <div class="flex items-baseline gap-1">
                <span
                  class="text-[9px] font-bold tracking-wider text-[#6b6e80]"
                  >FCP</span
                >
                <span
                  class="text-[11px] font-semibold tabular-nums"
                  class:text-[#52c41a]={status("fcp", snap.fcp) === "ok"}
                  class:text-[#faad14]={status("fcp", snap.fcp) === "warn"}
                  class:text-[#ff4d4f]={status("fcp", snap.fcp) === "danger"}
                >
                  {fmtTime(snap.fcp)}
                </span>
              </div>
            {:else}
              <div class="flex items-baseline gap-1">
                <span
                  class="text-[9px] font-bold tracking-wider text-[#6b6e80]"
                  >FCP</span
                >
                <button
                  class="text-[8px] font-bold uppercase tracking-wider text-[#6c8aff] bg-[#6c8aff]/[0.12] px-1.5 py-px rounded cursor-pointer hover:bg-[#6c8aff]/[0.22] transition-colors"
                  onclick={openPayment}>PRO</button
                >
              </div>
            {/if}
          {/if}

          {#if snap.lcp !== null}
            {#if isPremium}
              <div class="flex items-baseline gap-1">
                <span
                  class="text-[9px] font-bold tracking-wider text-[#6b6e80]"
                  >LCP</span
                >
                <span
                  class="text-[11px] font-semibold tabular-nums"
                  class:text-[#52c41a]={status("lcp", snap.lcp) === "ok"}
                  class:text-[#faad14]={status("lcp", snap.lcp) === "warn"}
                  class:text-[#ff4d4f]={status("lcp", snap.lcp) === "danger"}
                >
                  {fmtTime(snap.lcp)}
                </span>
              </div>
            {:else}
              <div class="flex items-baseline gap-1">
                <span
                  class="text-[9px] font-bold tracking-wider text-[#6b6e80]"
                  >LCP</span
                >
                <button
                  class="text-[8px] font-bold uppercase tracking-wider text-[#6c8aff] bg-[#6c8aff]/[0.12] px-1.5 py-px rounded cursor-pointer hover:bg-[#6c8aff]/[0.22] transition-colors"
                  onclick={openPayment}>PRO</button
                >
              </div>
            {/if}
          {/if}
        </div>
      {/if}

      <!-- Footer -->
      <div
        class="pt-1 mt-1 border-t border-white/[0.03]"
      >
        <span class="text-[9px] text-[#6b6e80] tracking-wide">
          Page: {uptime}
        </span>
      </div>
    </div>
  {/if}

  <!-- Collapsed bar -->
  {#if collapsed && snap}
    <div
      class="flex items-center gap-1 py-1.5 px-2.5 cursor-pointer"
      onclick={() => (collapsed = false)}
    >
      <span
        class="text-[10px] font-semibold tabular-nums"
        class:text-[#52c41a]={status("fps", snap.fps) === "ok"}
        class:text-[#faad14]={status("fps", snap.fps) === "warn"}
        class:text-[#ff4d4f]={status("fps", snap.fps) === "danger"}
      >
        {snap.fps} FPS
      </span>
      <span class="text-[10px] text-[#6b6e80] mx-px">·</span>
      <span
        class="text-[10px] font-semibold tabular-nums"
        class:text-[#52c41a]={status("dom", snap.dom) === "ok"}
        class:text-[#faad14]={status("dom", snap.dom) === "warn"}
        class:text-[#ff4d4f]={status("dom", snap.dom) === "danger"}
      >
        {snap.dom.toLocaleString()} DOM
      </span>
      {#if snap.memory}
        <span class="text-[10px] text-[#6b6e80] mx-px">·</span>
        <span class="text-[10px] font-semibold tabular-nums text-[#ebedf5]">
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
