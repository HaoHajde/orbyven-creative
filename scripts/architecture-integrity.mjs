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

function filesUnder(relativeRoot, extensions) {
  return walk(join(repoRoot, relativeRoot)).filter((file) => extensions.has(extname(file)));
}

function checkSourceBudgets() {
  const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);
  const webFiles = budgets.source.webRoots.flatMap((root) => filesUnder(root, sourceExtensions));
  const desktopFiles = filesUnder(budgets.source.desktopRoot, sourceExtensions);

  const oversizedWeb = webFiles.filter((file) => statSync(file).size > budgets.source.webMaxFileBytes);
  for (const file of oversizedWeb) {
    errors.push(`Web source file exceeds ${kb(budgets.source.webMaxFileBytes)}: ${rel(file)} (${kb(statSync(file).size)}). Split responsibilities before adding more code.`);
  }
  const largeWeb = webFiles.filter((file) => statSync(file).size > budgets.source.webLargeFileThresholdBytes);
  if (largeWeb.length > budgets.source.webMaxLargeFiles) {
    errors.push(`Web now has ${largeWeb.length} files over ${kb(budgets.source.webLargeFileThresholdBytes)}; budget is ${budgets.source.webMaxLargeFiles}. Refactor one large unit instead of creating another monolith.`);
  }

  const oversizedDesktop = desktopFiles.filter((file) => statSync(file).size > budgets.source.desktopMaxFileBytes);
  for (const file of oversizedDesktop) {
    errors.push(`Desktop source file exceeds ${kb(budgets.source.desktopMaxFileBytes)}: ${rel(file)} (${kb(statSync(file).size)}). Extract reusable UI/logic before growing the shell.`);
  }
  const largeDesktop = desktopFiles.filter((file) => statSync(file).size > budgets.source.desktopLargeFileThresholdBytes);
  if (largeDesktop.length > budgets.source.desktopMaxLargeFiles) {
    errors.push(`Desktop now has ${largeDesktop.length} files over ${kb(budgets.source.desktopLargeFileThresholdBytes)}; budget is ${budgets.source.desktopMaxLargeFiles}.`);
  }
  for (const file of desktopFiles.filter((file) => extname(file) === ".css")) {
    if (statSync(file).size > budgets.source.desktopCssMaxFileBytes) {
      errors.push(`Desktop CSS exceeds ${kb(budgets.source.desktopCssMaxFileBytes)}: ${rel(file)} (${kb(statSync(file).size)}). Split or remove obsolete rules.`);
    }
  }

  notes.push(`web source: ${webFiles.length} files, ${largeWeb.length} > ${kb(budgets.source.webLargeFileThresholdBytes)}`);
  notes.push(`desktop source: ${desktopFiles.length} files, ${largeDesktop.length} > ${kb(budgets.source.desktopLargeFileThresholdBytes)}`);

  const duplicatedServiceNames = new Set([
    "overview.ts", "leads.ts", "tasks.ts", "calendar.ts", "estimates.ts",
    "documents.ts", "expenses.ts", "team.ts", "orbyven-workspace.ts",
  ]);
  for (const file of desktopFiles) {
    if (duplicatedServiceNames.has(basename(file))) {
      errors.push(`Desktop duplicates a shared ORBYVEN service: ${rel(file)}. Reuse root lib/modules or lib/orbyven-workspace instead.`);
    }
  }

  const desktopText = desktopFiles
    .filter((file) => extname(file) !== ".css")
    .map((file) => [rel(file), readFileSync(file, "utf8")]);
  const forbiddenDesktopPatterns = [
    ["service-role key reference", /service[_-]?role|SUPABASE_SERVICE_ROLE|STRIPE_SECRET/i],
    ["remote workspace wrapper", /https:\/\/orbyven\.ro\/workspace\b/i],
  ];
  for (const [file, content] of desktopText) {
    for (const [label, pattern] of forbiddenDesktopPatterns) {
      if (pattern.test(content)) errors.push(`Desktop ${label} detected in ${file}. Keep privileged keys/server UI out of the installer.`);
    }
  }
}

function checkDependencies() {
  const web = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  const desktop = JSON.parse(readFileSync(join(repoRoot, "desktop/package.json"), "utf8"));
  const webRuntime = Object.keys(web.dependencies ?? {});
  const desktopRuntime = Object.keys(desktop.dependencies ?? {});

  const unapprovedWeb = webRuntime.filter((name) => !budgets.dependencies.webRuntimeAllowlist.includes(name));
  const unapprovedDesktop = desktopRuntime.filter((name) => !budgets.dependencies.desktopRuntimeAllowlist.includes(name));
  if (unapprovedWeb.length) errors.push("Unapproved web runtime dependencies: " + unapprovedWeb.join(", ") + ". Update architecture-budgets.json only after checking bundle impact.");
  if (unapprovedDesktop.length) errors.push("Unapproved desktop runtime dependencies: " + unapprovedDesktop.join(", ") + ". Prefer shared/native functionality before adding packages.");

  const desktopAll = new Set([...desktopRuntime, ...Object.keys(desktop.devDependencies ?? {})]);
  for (const name of budgets.dependencies.desktopForbidden) {
    if (desktopAll.has(name)) errors.push(`Desktop must not depend on ${name}; keep the Windows client lightweight and independent from the Next.js UI runtime.`);
  }

  for (const name of budgets.dependencies.sharedVersions) {
    const webVersion = web.dependencies?.[name];
    const desktopVersion = desktop.dependencies?.[name];
    if (webVersion && desktopVersion && webVersion !== desktopVersion) {
      errors.push(`Shared dependency version drift: ${name} web=${webVersion}, desktop=${desktopVersion}. Align them before merge.`);
    }
  }
  notes.push(`runtime deps: web=${webRuntime.length}, desktop=${desktopRuntime.length}`);
}

function checkPublicAssets() {
  const root = join(repoRoot, "public");
  const files = walk(root);
  const total = files.reduce((sum, file) => sum + statSync(file).size, 0);
  if (total > budgets.publicAssets.totalBytesMax) {
    errors.push(`public/ is ${mb(total)}; budget is ${mb(budgets.publicAssets.totalBytesMax)}. Compress/remove assets before adding more payload.`);
  }
  for (const file of files) {
    const relativePath = rel(file);
    const limit = budgets.publicAssets.exceptions[relativePath] ?? budgets.publicAssets.defaultFileBytesMax;
    if (statSync(file).size > limit) {
      errors.push(`Large public asset without explicit budget: ${relativePath} (${mb(statSync(file).size)} > ${mb(limit)}).`);
    }
  }
  notes.push(`public assets: ${files.length} files, ${mb(total)} total`);
}

function checkWebBuild() {
  const chunksRoot = join(repoRoot, ".next/static/chunks");
  if (!existsSync(chunksRoot)) {
    errors.push("Missing .next/static/chunks. Run next build before --web-build.");
    return;
  }
  const js = walk(chunksRoot).filter((file) => extname(file) === ".js");
  const total = js.reduce((sum, file) => sum + statSync(file).size, 0);
  const largest = js.reduce((max, file) => Math.max(max, statSync(file).size), 0);
  if (total > budgets.build.nextStaticJsTotalBytesMax) {
    errors.push(`Next static JS total ${mb(total)} exceeds ${mb(budgets.build.nextStaticJsTotalBytesMax)}.`);
  }
  if (largest > budgets.build.nextSingleJsChunkBytesMax) {
    errors.push(`Largest Next JS chunk ${mb(largest)} exceeds ${mb(budgets.build.nextSingleJsChunkBytesMax)}.`);
  }
  notes.push(`Next static JS: ${js.length} chunks, ${mb(total)} total, largest ${kb(largest)}`);
}

function checkDesktopBuild() {
  const dist = join(repoRoot, "desktop/dist");
  if (!existsSync(dist)) {
    errors.push("Missing desktop/dist. Run the desktop build before --desktop-build.");
    return;
  }
  const files = walk(dist);
  const total = files.reduce((sum, file) => sum + statSync(file).size, 0);
  if (total > budgets.build.desktopDistTotalBytesMax) {
    errors.push(`Desktop dist is ${mb(total)}; budget is ${mb(budgets.build.desktopDistTotalBytesMax)}.`);
  }

  const installerFolder = join(repoRoot, "desktop/src-tauri/target/release/bundle/nsis");
  if (existsSync(installerFolder)) {
    for (const installer of walk(installerFolder).filter((file) => file.toLowerCase().endsWith(".exe"))) {
      if (statSync(installer).size > budgets.build.desktopInstallerBytesMax) {
        errors.push(`Desktop installer ${basename(installer)} is ${mb(statSync(installer).size)}; budget is ${mb(budgets.build.desktopInstallerBytesMax)}.`);
      }
      notes.push(`desktop installer: ${basename(installer)} ${mb(statSync(installer).size)}`);
    }
  }
  notes.push(`desktop dist: ${files.length} files, ${mb(total)} total`);
}

checkSourceBudgets();
checkDependencies();
checkPublicAssets();
if (args.has("--web-build")) checkWebBuild();
if (args.has("--desktop-build")) checkDesktopBuild();

for (const note of notes) console.log("ARCH:", note);
if (errors.length) {
  console.error("\nArchitecture/lightweight budget failed:");
  for (const error of errors) console.error(" - " + error);
  process.exit(1);
}
console.log("Architecture/lightweight budget: OK");
