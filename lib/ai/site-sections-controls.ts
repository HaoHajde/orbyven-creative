import {
  type EditableSite,
  type SiteSectionId,
  SECTION_LABELS,
  applySitePatch,
} from "@/lib/ai/site-editor";

/** Hero remains first and visible. Every other finite section can be shown, hidden or reordered. */
export function setSectionVisible(
  site: EditableSite,
  section: SiteSectionId,
  visible: boolean
): EditableSite {
  if (section === "hero") return site;
  const hidden = site.hiddenSections.filter((id) => id !== section);
  if (!visible) hidden.push(section);
  return applySitePatch(site, { hiddenSections: hidden });
}

export function moveSection(
  site: EditableSite,
  section: SiteSectionId,
  direction: "up" | "down"
): EditableSite {
  const previous = site.sectionOrder.indexOf(section);
  const nextIndex = previous + (direction === "up" ? -1 : 1);
  if (
    section === "hero" ||
    previous < 1 ||
    nextIndex < 1 ||
    nextIndex >= site.sectionOrder.length
  ) return site;

  const order = [...site.sectionOrder];
  [order[previous], order[nextIndex]] = [order[nextIndex], order[previous]];
  return applySitePatch(site, { sectionOrder: order });
}

export function applySectionCommand(
  site: EditableSite,
  text: string
): { draft: EditableSite; message: string } | null {
  const request = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const found: { id: SiteSectionId; matcher: RegExp }[] = [
    { id: "services", matcher: /\b(servicii|serviciile|serviciu|serviciilor)\b/ },
    { id: "benefits", matcher: /\b(beneficii|avantaje|de ce noi|de ce sa ne aleaga)\b/ },
    { id: "about", matcher: /\b(despre|poveste|povestea)\b/ },
    { id: "gallery", matcher: /\b(galerie|portofoliu|proiecte|lucrari|imagini)\b/ },
    { id: "process", matcher: /\b(proces|cum lucram|etape|pasi)\b/ },
    { id: "faq", matcher: /\b(faq|intrebari|intrebari frecvente)\b/ },
    { id: "contact", matcher: /\b(contact|contactul|contacte)\b/ },
    { id: "hero", matcher: /\b(hero)\b/ },
  ];

  const section = found.find(({ matcher }) => matcher.test(request))?.id;
  if (!section) return null;

  const isHide = /\b(ascunde|dezactiveaza|elimina|scoate|fara)\b/.test(request);
  const isShow = /\b(arata|afiseaza|activeaza|adauga|pune|restaureaza)\b/.test(request);
  const isMove = /\b(muta|ridica|coboara|reordoneaza)\b/.test(request);

  if (!isHide && !isShow && !isMove) return null;
  if (section === "hero") {
    return {
      draft: site,
      message: "Hero rămâne prima secțiune vizibilă pentru a păstra structura validă.",
    };
  }

  let next = site;
  let verb = "";
  if (isHide) {
    next = setSectionVisible(site, section, false);
    verb = "ascunsă";
  } else if (isShow && !isMove) {
    next = setSectionVisible(site, section, true);
    verb = "afișată";
  } else if (isMove) {
    const direction = /\b(sus|inainte|deasupra|ridica)\b/.test(request)
      ? "up"
      : /\b(jos|dupa|sub|coboara)\b/.test(request)
        ? "down"
        : null;
    if (!direction) return null;
    next = moveSection(site, section, direction);
    verb = direction === "up" ? "mutată mai sus" : "mutată mai jos";
  }

  if (JSON.stringify(next) === JSON.stringify(site)) {
    return {
      draft: site,
      message: "Secțiunea " + SECTION_LABELS[section] + " este deja în această stare. Nu am consumat API.",
    };
  }

  return {
    draft: next,
    message:
      "Motor local gratuit: secțiunea " +
      SECTION_LABELS[section] +
      " a fost " +
      verb +
      ". Folosește Undo dacă vrei să revii.",
  };
}
