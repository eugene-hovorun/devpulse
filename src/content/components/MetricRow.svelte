<script lang="ts">
  import Sparkline from "./Sparkline.svelte";

  interface Props {
    label: string;
    value: string;
    status?: "ok" | "warn" | "danger";
    history?: number[];
    showHistory?: boolean;
    locked?: boolean;
    helpUrl?: string;
    onunlock?: () => void;
  }

  let {
    label,
    value,
    status = "ok",
    history,
    showHistory = true,
    locked = false,
    helpUrl,
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
  <span class="w-9 shrink-0 flex items-center gap-0.5">
    <span class="text-[9px] font-bold tracking-widest uppercase text-hud-fg-muted">{label}</span>
    {#if helpUrl}
      <a
        href={helpUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center justify-center w-3 h-3 rounded-full text-hud-fg-muted opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
        title="Learn more about {label}"
        onclick={(e: MouseEvent) => e.stopPropagation()}
      >
        <svg width="7" height="7" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3.5a.75.75 0 0 1 1.5 0v.5a.75.75 0 0 1-1.5 0v-.5ZM8 7a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 7Z"/>
        </svg>
      </a>
    {/if}
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
