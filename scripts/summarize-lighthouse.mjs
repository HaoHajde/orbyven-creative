import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const folder = process.argv[2] ?? "lighthouse";
for (const filename of readdirSync(folder).filter((name) => name.endsWith(".json")).sort()) {
  const report = JSON.parse(readFileSync(join(folder, filename), "utf8"));
  const metric = (id) => report.audits?.[id]?.numericValue;
  const score = (id) => {
    const value = report.categories?.[id]?.score;
    return typeof value === "number" ? Math.round(value * 100) : "n/a";
  };
  const rounded = (id) => {
    const value = metric(id);
    return typeof value === "number" ? Math.round(value) : "n/a";
  };
  console.log(`${filename}: performance=${score("performance")} accessibility=${score("accessibility")} LCP=${rounded("largest-contentful-paint")}ms INP=${rounded("interaction-to-next-paint")}ms TBT=${rounded("total-blocking-time")}ms CLS=${metric("cumulative-layout-shift") ?? "n/a"}`);
}
console.log("Lighthouse is a synthetic public-route audit; authenticated workspace and real-user INP require a separate secured browser session.");
