import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const desktop = resolve(here, "..");
const repo = resolve(desktop, "..");
const source = resolve(repo, "public", "thermal-planner", "index.html");
const destination = resolve(desktop, "public", "thermal-planner", "index.html");

rmSync(resolve(desktop, "public"), { recursive: true, force: true });
mkdirSync(dirname(destination), { recursive: true });
copyFileSync(source, destination);
console.log("Synced web thermal planner into desktop bundle.");
