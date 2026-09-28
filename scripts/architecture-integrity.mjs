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
const kb = (bytes) => (bytes / 1024).toFixed(1) + " KiB";
const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MiB";

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
function sourceFiles(relativeRoot) {
  const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);
  return walk(join(repoRoot, relativeRoot)).filter((file) => extensions.has(extname(file)));
}
function checkSourceBudgets() {
  const webFiles = budgets.source.webRoots.flatMap(sourceFiles);
  const desktopFiles = sourceFiles(budgets.source.desktopRoot);
  const oversizedWeb = webFiles.filter((file) => statSync(file).size > budgets.source.webMaxFileBytes);
  for (const file of oversizedWeb) errors.push(`Web source exceeds ${kb(budgets.source.webMaxFileBytes)}: ${rel(file)} (${kb(statSync(file).size)}).`);
  const largeWeb = webFiles.filter((file) => statSync(file).size > budgets.source.webLargeFileThresholdBytes);
  if (largeWeb.length > budgets.source.webMaxLargeFiles) errors.push(`Web large-file count grew to ${largeWeb.length}; baseline budget is ${budgets.source.webMaxLargeFiles} files over ${kb(budgets.source.webLargeFileThresholdBytes)}. Refactor a responsibility before adding another monolith.`);

  const oversizedDesktop = desktopFiles.filter((file) => statSync(file).size > budgets.source.desktopMaxFileBytes);
  for (const file of oversizedDesktop) errors.push(`Desktop source exceeds ${kb(budgets.source.desktopMaxFileBytes)}: ${rel(file)} (${kb(statSync(file).size)}).`);
  const largeDesktop = desktopFiles.filter((file) => statSync(file).size > budgets.source.desktopLargeFileThresholdBytes);
  if (largeDesktop.length > budgets.source.desktopMaxLargeFiles) errors.push(`Desktop large-file count grew to ${largeDesktop.length}; budget is ${budgets.source.desktopMaxLargeFiles}.`);
  for (const file of desktopFiles.filter((file) => extname(file) === ".css")) {
    if (statSync(file).size > budgets.source.desktopCssMaxFileBytes) errors.push(`Desktop CSS exceeds ${kb(budgets.source.desktopCssMaxFileBytes)}: ${rel(file)} (${kb(statSync(file).size)}).`);
  }

  const duplicatedServices = new Set(["overview.ts","leads.ts","tasks.ts","calendar.ts","estimates.ts","documents.ts","expenses.ts","team.ts","orbyven-workspace.ts","orbyven-modules.ts"]);
  for (const file of desktopFiles) if (duplicatedServices.has(basename(file))) errors.push(`Desktop duplicates shared business logic: ${rel(file)}. Reuse root lib/ instead.`);

  for (const file of desktopFiles.filter((file) => extname(file) !== ".css")) {
    const content = readFileSync(file, "utf8");
    if (/service[_-]?role|SUPABASE_SERVICE_ROLE|STRIPE_SECRET/i.test(content)) errors.push(`Privileged-secret reference detected in Desktop source: ${rel(file)}.`);
    if (/https:\/\/orbyven\.ro\/workspace\b/i.test(content)) errors.push(`Remote workspace wrapper detected in Desktop source: ${rel(file)}. Keep the app locally bundled.`);
    if (/from\s+["']next(?:\/|["'])/.test(content)) errors.push(`Direct Next.js import detected in Desktop source: ${rel(file)}. Use shared adapters/shims instead.`);
  }
  notes.push(`web source: ${webFiles.length} files; ${largeWeb.length} above ${kb(budgets.source.webLargeFileThresholdBytes)}`);
  notes.push(`desktop source: ${desktopFiles.length} files; ${largeDesktop.length} above ${kb(budgets.source.desktopLargeFileThresholdBytes)}`);
}
function checkDependencies() {
  const web = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  const desktop = JSON.parse(readFileSync(join(repoRoot, "desktop/package.json"), "utf8"));
  const webRuntime = Object.keys(web.dependencies ?? {});
  const desktopRuntime = Object.keys(desktop.dependencies ?? {});
  const unapprovedWeb = webRuntime.filter((name) => !budgets.dependencies.webRuntimeAllowlist.includes(name));
  const unapprovedDesktop = desktopRuntime.filter((name) => !budgets.dependencies.desktopRuntimeAllowlist.includes(name));
  if (unapprovedWeb.length) errors.push("Unapproved web runtime dependencies: " + unapprovedWeb.join(", "));
  if (unapprovedDesktop.length) errors.push("Unapproved desktop runtime dependencies: " + unapprovedDesktop.join(", "));
  const desktopAll = new Set([...desktopRuntime, ...Object.keys(desktop.devDependencies ?? {})]);
  for (const name of budgets.dependencies.desktopForbidden) if (desktopAll.has(name)) errors.push(`Desktop must not depend on ${name}.`);
  for (const name of budgets.dependencies.sharedVersions) {
    const a=web.dependencies?.[name], b=desktop.dependencies?.[name];
    if (a && b && a !== b) errors.push(`Shared dependency drift: ${name} web=${a}, desktop=${b}.`);
  }
  notes.push(`runtime dependencies: web=${webRuntime.length}; desktop=${desktopRuntime.length}`);
}
function checkPublicAssets() {
  const files = walk(join(repoRoot, "public"));
  const total = files.reduce((sum,file)=>sum+statSync(file).size,0);
  if (total > budgets.publicAssets.totalBytesMax) errors.push(`public/ grew to ${mb(total)}; budget is ${mb(budgets.publicAssets.totalBytesMax)}.`);
  for (const file of files) {
    const path=rel(file);
    const limit=budgets.publicAssets.exceptions[path] ?? budgets.publicAssets.defaultFileBytesMax;
    if (statSync(file).size > limit) errors.push(`Public asset exceeds budget: ${path} (${mb(statSync(file).size)} > ${mb(limit)}).`);
  }
  notes.push(`public assets: ${files.length}; ${mb(total)} total`);
}
function checkWebBuild() {
  const root=join(repoRoot,".next/static/chunks");
  if (!existsSync(root)) { errors.push("Missing .next/static/chunks; run next build before --web-build."); return; }
  const files=walk(root).filter((file)=>extname(file)===".js");
  const total=files.reduce((sum,file)=>sum+statSync(file).size,0);
  const largest=files.reduce((max,file)=>Math.max(max,statSync(file).size),0);
  if (total > budgets.build.nextStaticJsTotalBytesMax) errors.push(`Next static JS total ${mb(total)} exceeds ${mb(budgets.build.nextStaticJsTotalBytesMax)}.`);
  if (largest > budgets.build.nextSingleJsChunkBytesMax) errors.push(`Largest Next JS chunk ${mb(largest)} exceeds ${mb(budgets.build.nextSingleJsChunkBytesMax)}.`);
  notes.push(`Next JS: ${files.length} chunks; ${mb(total)} total; largest ${kb(largest)}`);
}
function checkDesktopBuild() {
  const root=join(repoRoot,"desktop/dist");
  if (!existsSync(root)) { errors.push("Missing desktop/dist; run desktop build before --desktop-build."); return; }
  const files=walk(root), total=files.reduce((sum,file)=>sum+statSync(file).size,0);
  if (total > budgets.build.desktopDistTotalBytesMax) errors.push(`Desktop dist ${mb(total)} exceeds ${mb(budgets.build.desktopDistTotalBytesMax)}.`);
  const installers=walk(join(repoRoot,"desktop/src-tauri/target/release/bundle/nsis")).filter((file)=>file.toLowerCase().endsWith(".exe"));
  for (const file of installers) {
    if (statSync(file).size > budgets.build.desktopInstallerBytesMax) errors.push(`Desktop installer ${basename(file)} is ${mb(statSync(file).size)}; max ${mb(budgets.build.desktopInstallerBytesMax)}.`);
    notes.push(`desktop installer: ${basename(file)} ${mb(statSync(file).size)}`);
  }
  notes.push(`desktop dist: ${files.length} files; ${mb(total)} total`);
}

checkSourceBudgets();
checkDependencies();
checkPublicAssets();
if (args.has("--web-build")) checkWebBuild();
if (args.has("--desktop-build")) checkDesktopBuild();

for (const note of notes) console.log("ARCH:", note);
if (errors.length) {
  console.error("\nArchitecture/lightweight guard failed:");
  for (const error of errors) console.error(" - " + error);
  process.exit(1);
}
console.log("Architecture/lightweight guard: OK");
