<script lang="ts">
  interface Props {
    history: number[];
    color: string;
    width?: number;
    height?: number;
  }

  let { history, color, width = 48, height = 16 }: Props = $props();

  let points = $derived.by(() => {
    if (history.length < 2) return "";
    const max = Math.max(...history, 1);
    const min = Math.min(...history, 0);
    const range = max - min || 1;
    const step = width / (history.length - 1);
    return history
      .map((v, i) => {
        const x = i * step;
        const y = height - ((v - min) / range) * (height - 2) - 1;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  });
</script>

{#if points}
  <svg
    {width}
    {height}
    viewBox="0 0 {width} {height}"
    class="shrink-0 opacity-70"
  >
    <polyline
      fill="none"
      stroke={color}
      stroke-width="1.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      {points}
    />
  </svg>
{/if}
