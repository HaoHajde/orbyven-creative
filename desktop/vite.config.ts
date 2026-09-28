import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const directory = fileURLToPath(new URL(".", import.meta.url));
const root = fileURLToPath(new URL("../", import.meta.url));
const client = fileURLToPath(new URL("./src/client.ts", import.meta.url));

export default defineConfig({
  plugins: [react()],
  // The desktop app uses its own plain CSS, not the parent Next.js Tailwind/PostCSS config.
  css: { postcss: { plugins: [] } },
  root: directory,
  resolve: {
    alias: [
      // Reuse the EXISTING ORBYVEN modules and access-state logic unchanged.
      // Override only the Next.js Supabase client (which reads process.env).
      { find: /^@\/lib\/orbyven-supabase$/, replacement: client },
      { find: "@", replacement: root },
    ],
  },
  server: { port: 1420, strictPort: true, host: "127.0.0.1", fs: { allow: [root] } },
  build: { outDir: "./dist", emptyOutDir: true, target: "es2022" },
  clearScreen: false,
});
