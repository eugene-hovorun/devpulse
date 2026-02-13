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

  const STATUS_COLORS = {
    ok: "#52c41a",
    warn: "#faad14",
    danger: "#ff4d4f",
  };

  let sparkColor = $derived(STATUS_COLORS[status]);
</script>

<div
  class="flex items-center py-[3px] gap-1.5 border-b border-white/[0.03] last:border-b-0"
>
  <span
    class="w-9 shrink-0 text-[9px] font-bold tracking-widest uppercase text-[#6b6e80]"
  >
    {label}
  </span>

  {#if locked}
    <div class="flex-1 flex items-center gap-1">
      <span class="text-[11px] font-semibold text-[#3a3c4a] tracking-wide"
        >••••</span
      >
      <button
        class="text-[8px] font-bold uppercase tracking-wider text-[#6c8aff] bg-[#6c8aff]/[0.12] px-1.5 py-px rounded cursor-pointer hover:bg-[#6c8aff]/[0.22] transition-colors"
        onclick={onunlock}
      >
        PRO
      </button>
    </div>
  {:else}
    <span
      class="flex-1 text-[11px] font-semibold tabular-nums whitespace-nowrap"
      class:text-[#52c41a]={status === "ok"}
      class:text-[#faad14]={status === "warn"}
      class:text-[#ff4d4f]={status === "danger"}
    >
      {@html value}
    </span>

    {#if showHistory && history && history.length >= 2}
      <Sparkline {history} color={sparkColor} />
    {/if}
  {/if}
</div>
