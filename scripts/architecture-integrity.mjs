import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const budgets = JSON.parse(readFileSync(join(repoRoot, "config/architecture-budgets.json"), "utf8"));
const args = new Set(process.argv.slice(2));
const errors = [];
const notes = [];

const normalize = (value) => value.split("\\").join("/");
const rel = (file) => normalize(relative(repoRoot, file));
const kib = (bytes) => (bytes / 1024).toFixed(1) + " KiB";
const mib = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MiB";
const sourceBytes = (file) => Buffer.byteLength(readFileSync(file, "utf8").replace(/\r\n/g, "\n"), "utf8");
const sourceOnly = args.has("--source");
const webBuildOnly = args.has("--web-build-only");
const desktopBuildOnly = args.has("--desktop-build-only");
const fullSourceChecks = sourceOnly || (!webBuildOnly && !desktopBuildOnly);

function walk(folder) {
  if (!existsSync(folder)) return [];
  const output = [];
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", "target", ".git"].includes(entry.name)) continue;
    const path = join(folder, entry.name);
    if (entry.isDirectory()) output.push(...walk(path));
    else if (entry.isFile()) output.push(path);
  }
  return output;
}

function sourceFiles(root) {
  const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".mjs", ".cjs"]);
  return walk(join(repoRoot, root)).filter((file) => extensions.has(extname(file)));
}

function checkSourceBudgets() {
  const webFiles = budgets.source.webRoots.flatMap(sourceFiles);
  const desktopFiles = sourceFiles(budgets.source.desktopRoot);
  const largeWeb = webFiles.filter((file) => sourceBytes(file) > budgets.source.webLargeFileThresholdBytes);
  const largeDesktop = desktopFiles.filter((file) => sourceBytes(file) > budgets.source.desktopLargeFileThresholdBytes);

  for (const file of webFiles.filter((file) => sourceBytes(file) > budgets.source.webMaxFileBytes)) {
    errors.push(`Web source exceeds ${kib(budgets.source.webMaxFileBytes)}: ${rel(file)} (${kib(sourceBytes(file))}).`);
  }
  if (largeWeb.length > budgets.source.webMaxLargeFiles) {
    errors.push(`Web large-file count grew to ${largeWeb.length}; baseline is ${budgets.source.webMaxLargeFiles} files over ${kib(budgets.source.webLargeFileThresholdBytes)}. Extract a responsibility instead of growing another monolith.`);
  }

  for (const file of desktopFiles.filter((file) => sourceBytes(file) > budgets.source.desktopMaxFileBytes)) {
    errors.push(`Desktop source exceeds ${kib(budgets.source.desktopMaxFileBytes)}: ${rel(file)} (${kib(sourceBytes(file))}).`);
  }
  if (largeDesktop.length > budgets.source.desktopMaxLargeFiles) {
    errors.push(`Desktop large-file count grew to ${largeDesktop.length}; baseline is ${budgets.source.desktopMaxLargeFiles}.`);
  }
  for (const file of desktopFiles.filter((file) => extname(file) === ".css")) {
    if (sourceBytes(file) > budgets.source.desktopCssMaxFileBytes) {
      errors.push(`Desktop CSS exceeds ${kib(budgets.source.desktopCssMaxFileBytes)}: ${rel(file)} (${kib(sourceBytes(file))}).`);
    }
  }

  const duplicatedServices = new Set([
    "overview.ts", "leads.ts", "tasks.ts", "calendar.ts", "estimates.ts",
    "documents.ts", "expenses.ts", "inventory.ts", "team.ts",
    "orbyven-workspace.ts", "orbyven-modules.ts",
  ]);
  for (const file of desktopFiles) {
    if (duplicatedServices.has(basename(file))) errors.push(`Desktop duplicates shared business logic: ${rel(file)}. Reuse root lib/ instead.`);
  }

  for (const file of desktopFiles.filter((file) => extname(file) !== ".css")) {
    const content = readFileSync(file, "utf8");
    if (/service[_-]?role|SUPABASE_SERVICE_ROLE|STRIPE_SECRET/i.test(content)) {
      errors.push(`Privileged secret reference detected in Desktop source: ${rel(file)}.`);
    }
    if (/https:\/\/orbyven\.ro\/workspace\b/i.test(content)) {
      errors.push(`Remote workspace wrapper detected in Desktop source: ${rel(file)}. Keep Windows locally bundled.`);
    }
  }

  for (const [relativePath, maxBytes] of Object.entries(budgets.source.hotspotMaxBytes ?? {})) {
    const file = join(repoRoot, relativePath);
    if (!existsSync(file)) {
      errors.push(`Tracked hotspot disappeared without updating architecture budget: ${relativePath}.`);
      continue;
    }
    const bytes = sourceBytes(file);
    if (bytes > maxBytes) {
      errors.push(`Hotspot grew beyond its frozen ceiling: ${relativePath} (${kib(bytes)} > ${kib(maxBytes)}). Extract a coherent responsibility instead of raising the limit.`);
    }
  }

  notes.push(`web source: ${webFiles.length} files; ${largeWeb.length} above ${kib(budgets.source.webLargeFileThresholdBytes)}`);
  notes.push(`desktop source: ${desktopFiles.length} files; ${largeDesktop.length} above ${kib(budgets.source.desktopLargeFileThresholdBytes)}`);
}

function checkWorkspaceChunking() {
  const file = join(repoRoot, "components/WorkspaceContent.tsx");
  if (!existsSync(file)) {
    errors.push("WorkspaceContent.tsx missing; cannot verify dashboard module chunking.");
    return;
  }
  const content = readFileSync(file, "utf8");
  for (const moduleName of budgets.structure?.workspaceDynamicModules ?? []) {
    const dynamicPattern = new RegExp(`const\\s+${moduleName}\\s*=\\s*dynamic\\(\\(\\)\\s*=>\\s*import\\(`);
    if (!dynamicPattern.test(content)) {
      errors.push(`Workspace module is no longer lazy-loaded: ${moduleName}. Keep heavy modules out of the initial dashboard bundle.`);
    }
    const staticPattern = new RegExp(`import\\s+${moduleName}\\s+from\\s+["'][^"']*modules/${moduleName}["']`);
    if (staticPattern.test(content)) {
      errors.push(`Static workspace module import detected: ${moduleName}. Use next/dynamic at module scope.`);
    }
  }
  notes.push(`workspace dynamic modules: ${(budgets.structure?.workspaceDynamicModules ?? []).length} guarded`);
}

function checkDependencies() {
  const web = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  const desktop = JSON.parse(readFileSync(join(repoRoot, "desktop/package.json"), "utf8"));
  const webRuntime = Object.keys(web.dependencies ?? {});
  const desktopRuntime = Object.keys(desktop.dependencies ?? {});

  const unapprovedWeb = webRuntime.filter((name) => !budgets.dependencies.webRuntimeAllowlist.includes(name));
  const unapprovedDesktop = desktopRuntime.filter((name) => !budgets.dependencies.desktopRuntimeAllowlist.includes(name));
  if (unapprovedWeb.length) errors.push("Unapproved Web runtime dependencies: " + unapprovedWeb.join(", ") + ".");
  if (unapprovedDesktop.length) errors.push("Unapproved Desktop runtime dependencies: " + unapprovedDesktop.join(", ") + ".");

  const desktopAll = new Set([...desktopRuntime, ...Object.keys(desktop.devDependencies ?? {})]);
  for (const name of budgets.dependencies.desktopForbidden) {
    if (desktopAll.has(name)) errors.push(`Desktop must not depend directly on ${name}.`);
  }
  for (const name of budgets.dependencies.sharedVersions) {
    const webVersion = web.dependencies?.[name];
    const desktopVersion = desktop.dependencies?.[name];
    if (webVersion && desktopVersion && webVersion !== desktopVersion) {
      errors.push(`Shared dependency drift: ${name} Web=${webVersion}, Desktop=${desktopVersion}.`);
    }
  }
  notes.push(`runtime dependencies: Web=${webRuntime.length}; Desktop=${desktopRuntime.length}`);
}

function checkPublicAssets() {
  const files = walk(join(repoRoot, "public"));
  const total = files.reduce((sum, file) => sum + statSync(file).size, 0);
  if (total > budgets.publicAssets.totalBytesMax) {
    errors.push(`public/ is ${mib(total)}; budget is ${mib(budgets.publicAssets.totalBytesMax)}.`);
  }
  for (const file of files) {
    const path = rel(file);
    const limit = budgets.publicAssets.exceptions[path] ?? budgets.publicAssets.defaultFileBytesMax;
    if (statSync(file).size > limit) errors.push(`Public asset exceeds budget: ${path} (${mib(statSync(file).size)} > ${mib(limit)}).`);
  }
  notes.push(`public assets: ${files.length}; ${mib(total)} total`);
}

function checkWebBuild() {
  const root = join(repoRoot, ".next/static/chunks");
  if (!existsSync(root)) {
    errors.push("Missing .next/static/chunks; run npm run build before --web-build-only.");
    return;
  }
  const files = walk(root).filter((file) => extname(file) === ".js");
  const total = files.reduce((sum, file) => sum + statSync(file).size, 0);
  const largest = files.reduce((max, file) => Math.max(max, statSync(file).size), 0);
  if (total > budgets.build.nextStaticJsTotalBytesMax) errors.push(`Next static JS ${mib(total)} exceeds ${mib(budgets.build.nextStaticJsTotalBytesMax)}.`);
  if (largest > budgets.build.nextSingleJsChunkBytesMax) errors.push(`Largest Next JS chunk ${mib(largest)} exceeds ${mib(budgets.build.nextSingleJsChunkBytesMax)}.`);
  notes.push(`Next JS: ${files.length} chunks; ${mib(total)} total; largest ${kib(largest)}`);
}

function checkDesktopBuild() {
  const root = join(repoRoot, "desktop/dist");
  if (!existsSync(root)) {
    errors.push("Missing desktop/dist; run Desktop build before --desktop-build-only.");
    return;
  }
  const files = walk(root);
  const total = files.reduce((sum, file) => sum + statSync(file).size, 0);
  if (total > budgets.build.desktopDistTotalBytesMax) errors.push(`Desktop dist ${mib(total)} exceeds ${mib(budgets.build.desktopDistTotalBytesMax)}.`);

  const installersRoot = join(repoRoot, "desktop/src-tauri/target/release/bundle/nsis");
  const installers = walk(installersRoot).filter((file) => file.toLowerCase().endsWith(".exe"));
  if (!installers.length) errors.push("No Windows NSIS installer found for Desktop build budget.");
  for (const file of installers) {
    if (statSync(file).size > budgets.build.desktopInstallerBytesMax) errors.push(`Desktop installer ${basename(file)} is ${mib(statSync(file).size)}; max ${mib(budgets.build.desktopInstallerBytesMax)}.`);
    notes.push(`Desktop installer: ${basename(file)} ${mib(statSync(file).size)}`);
  }
  notes.push(`Desktop dist: ${files.length} files; ${mib(total)} total`);
}

if (fullSourceChecks) {
  checkSourceBudgets();
  checkDependencies();
  checkPublicAssets();
  checkWorkspaceChunking();
}
if (webBuildOnly) checkWebBuild();
if (desktopBuildOnly) checkDesktopBuild();

for (const note of notes) console.log("ARCH:", note);
if (errors.length) {
  console.error("\nArchitecture/lightweight guard failed:");
  for (const error of errors) console.error(" - " + error);
  process.exit(1);
}
console.log("Architecture/lightweight guard: OK");
