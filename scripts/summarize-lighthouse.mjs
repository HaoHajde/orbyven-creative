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
  if (filename === "templates-mobile.json") {
    const lcpNode = report.audits?.["largest-contentful-paint-element"]?.details?.items?.[0]?.node;
    const snippet = typeof lcpNode?.snippet === "string" ? lcpNode.snippet.replace(/\s+/g, " ").slice(0, 200) : "not reported";
    console.log("templates-mobile LCP element: " + snippet);
    const timing = report.audits?.["lcp-breakdown-insight"]?.details?.items;
    if (Array.isArray(timing)) {
      console.log("templates-mobile LCP insight: " + JSON.stringify(timing.slice(0, 4)).slice(0, 650));
    }
  }
}
console.log("Lighthouse is a synthetic public-route audit; authenticated workspace and real-user INP require a separate secured browser session.");
