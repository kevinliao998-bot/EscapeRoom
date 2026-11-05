import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "./",
  publicDir: fileURLToPath(new URL("../Game/public", import.meta.url)),
  server: { host: "127.0.0.1", port: 4176, strictPort: true },
  preview: { host: "127.0.0.1", port: 4176, strictPort: true },
  build: {
    outDir: "../dist-campaign.local",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600,
  },
});
