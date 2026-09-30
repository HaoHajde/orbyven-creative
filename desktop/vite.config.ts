import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

const directory = fileURLToPath(new URL(".", import.meta.url));
const root = fileURLToPath(new URL("../", import.meta.url));
const client = fileURLToPath(new URL("./src/client.ts", import.meta.url));
const reactRuntime = fileURLToPath(new URL("./node_modules/react", import.meta.url));
const reactDomRuntime = fileURLToPath(new URL("./node_modules/react-dom", import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: directory,
  resolve: {
    alias: [
      // Shared web components live outside /desktop. Force all of them to use
      // the desktop React runtime instead of resolving from the repository root.
      { find: /^react$/, replacement: reactRuntime },
      { find: /^react\/(.*)$/, replacement: reactRuntime + "/$1" },
      { find: /^react-dom$/, replacement: reactDomRuntime },
      { find: /^react-dom\/(.*)$/, replacement: reactDomRuntime + "/$1" },
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
