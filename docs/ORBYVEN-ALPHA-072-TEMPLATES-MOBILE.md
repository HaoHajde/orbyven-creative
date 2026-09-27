# ORBYVEN mobile template rendering — Alpha 0.7.2

Scope: **catalog rendering only**, not a preview redesign.

- Current `/templates` uses the original linked `FeaturedTemplatePreview` and `ClientTemplatePreview` components. The cards keep all source content, photos, illustrations, labels, links and embedded pilot demos.
- Add `content-visibility: auto` and remembered, proportionate intrinsic heights at the outer card surfaces (480px featured, 520px catalog). The browser can skip layout/paint of offscreen card internals until it approaches the viewport while maintaining scroll geometry. The visible cards always render their original previews.
- Existing embedded demos still mount near the viewport through the existing IntersectionObserver, and still retain `sandbox="allow-scripts"`. No placeholder screenshot or replacement card image is added.
- Add regression contracts and run the full unauthenticated mobile/desktop Lighthouse matrix whenever catalog/preview files change.

Baseline before the change (synthetic GitHub runner, not real-user CWV): mobile templates 89/100; LCP ~3.7s. Inspect this PR's Lighthouse job before claiming an improvement. Content visibility can reduce offscreen painting but does not guarantee an LCP benefit on every mobile device. Retest real card cropping and embedded demo transitions manually on phone widths 360/390px.

**No database, billing, legal, desktop or authentication changes.** PR #106 remains staging-gated.

## CI measurement after the hero correction

- Matched synthetic GitHub Lighthouse runner: initial mobile `/templates` 89/100, LCP 3717 ms, and desktop 99/100, LCP 1007 ms (first card-only optimization).
- Final PR audit after making the heading visible in HTML: mobile **93/100, LCP 3208 ms**, desktop **100/100, LCP 705 ms**. The mobile LCP difference in these two individual lab runs is 509 ms (~13.7%). Treat this as a preliminary synthetic measurement, not a proven field improvement or real-user Core Web Vitals.
- Actual LCP is the hero heading “Vezi. Înțelegi. Alegi.”; the original Framer Motion `initial: { opacity: 0 }` delayed its visibility until client hydration. The title is now a normal visible SSR `<h1>`, identical typography and content. Other orb/background, label and CTA animations stay intact.
- No card previews were replaced. The browser may skip painting cards that remain offscreen; the original image/iframe transitions need a manual check on a real phone before release.
