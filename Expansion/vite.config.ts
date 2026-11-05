import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
const here = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  root: here,
  base: "./",
  publicDir: fileURLToPath(new URL("../Game/public", import.meta.url)),
  server: { host: "127.0.0.1", port: 4174, strictPort: true },
  preview: { host: "127.0.0.1", port: 4174, strictPort: true },
  build: {
    outDir: "../dist-b1.local",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600,
  },
});
