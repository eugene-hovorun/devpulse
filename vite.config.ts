import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";
import { copyFileSync } from "fs";

export default defineConfig({
  plugins: [
    svelte({
      // Emit component CSS as JS strings, not separate files
      // This is critical for shadow DOM injection
      compilerOptions: {
        css: "injected",
      },
    }),
    {
      name: "copy-extpay",
      closeBundle() {
        copyFileSync("node_modules/extpay/dist/ExtPay.js", "dist/ExtPay.js");
      },
    },
  ],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "esnext",
    // Inline all CSS into JS — no separate .css files
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/index.ts"),
        "content/devpulse": resolve(__dirname, "src/content/devpulse.ts"),
      },
      output: {
        // Force everything into single files — no chunk splitting
        // Content scripts CANNOT load chunks
        manualChunks: undefined,
        inlineDynamicImports: false,
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
