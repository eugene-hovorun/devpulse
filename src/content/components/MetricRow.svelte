<script lang="ts">
  import Sparkline from "./Sparkline.svelte";

  interface Props {
    label: string;
    value: string;
    status?: "ok" | "warn" | "danger";
    history?: number[];
    showHistory?: boolean;
    locked?: boolean;
    onunlock?: () => void;
  }

  let {
    label,
    value,
    status = "ok",
    history,
    showHistory = true,
    locked = false,
    onunlock,
  }: Props = $props();

  let sparkColor = $derived(
    status === "ok"
      ? "var(--hud-ok)"
      : status === "warn"
        ? "var(--hud-warn)"
        : "var(--hud-danger)"
  );
</script>

<div
  class="flex items-center py-[3px] gap-1.5 border-b border-hud-border-subtle last:border-b-0"
>
  <span
    class="w-9 shrink-0 text-[9px] font-bold tracking-widest uppercase text-hud-fg-muted"
  >
    {label}
  </span>

  {#if locked}
    <div class="flex-1 flex items-center gap-1">
      <span class="text-[11px] font-semibold text-hud-locked tracking-wide"
        >••••</span
      >
      <button
        class="text-[8px] font-bold uppercase tracking-wider text-hud-pro bg-hud-pro-bg px-1.5 py-px rounded cursor-pointer hover:opacity-80 transition-opacity"
        onclick={onunlock}
      >
        PRO
      </button>
    </div>
  {:else}
    <span
      class={`flex-1 text-[11px] font-semibold tabular-nums whitespace-nowrap ${
        status === "ok"
          ? "text-hud-ok"
          : status === "warn"
            ? "text-hud-warn"
            : "text-hud-danger"
      }`}
    >
      {@html value}
    </span>

    {#if showHistory && history && history.length >= 2}
      <Sparkline {history} color={sparkColor} />
    {/if}
  {/if}
</div>
