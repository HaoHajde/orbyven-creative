import type { VideoLocale, VideoStyle } from "@/lib/video-ai-director";

export type VideoAiCopy = {
  defaultBrief: string;
  styleOptions: Array<{ value: VideoStyle; label: string; detail: string }>;
  engines: Array<{ name: string; note: string; status: string }>;
  heroLead: string;
  heroAccent: string;
  heroBody: string;
  directorInput: string;
  localNoCost: string;
  steps: Array<[string, string, string]>;
  panelEyebrow: string;
  panelTitle: string;
  creativeBrief: string;
  briefPlaceholder: string;
  duration: string;
  format: string;
  direction: string;
  directorReady: string;
  directorNote: string;
  generateDirection: string;
  generatedDirection: string;
  scenesSuffix: string;
  visualSystem: string;
  copyAll: string;
  copied: string;
  scene: string;
  end: string;
  camera: string;
  transition: string;
  generationPrompt: string;
  copy: string;
  renderEngine: string;
  renderTitle: string;
  renderAccent: string;
  renderBody: string;
  connected: string;
  selectedMissingEndpoint: string;
  referenceLabel: string;
  referenceNote: string;
  renderJob: string;
  openGenerated: string;
  downloadPackage: string;
  preparing: string;
  renderingInProgress: string;
  signInToRender: string;
  generateFinalVideo: string;
  preparePackage: string;
  noGpuCost: string;
  loginRequired: string;
  renderStatusUnavailable: string;
  historyUnavailable: string;
  renderJobCreateFailed: string;
};

const copy: Record<VideoLocale, VideoAiCopy> = {
  ro: {
    defaultBrief:
      "Creează un video premium de lansare ORBYVEN Creative care trece fluid prin pagina principală, Templates, AI Web Design, Dashboard, modulele conectate și acțiunile AI. Păstrează produsul ORBYVEN recognoscibil, folosește foarte puțin text și tranziții cinematice continue.",
    styleOptions: [
      { value: "product", label: "Lansare produs", detail: "Precis, premium, concentrat pe produs." },
      { value: "cinematic", label: "Cinematic", detail: "Mai multă atmosferă, profunzime și mișcare de cameră." },
      { value: "minimal-ui", label: "Prezentare UI", detail: "Accent mai puternic pe interfața reală." },
      { value: "social", label: "Social", detail: "Ritm mai rapid pentru Reels, TikTok și Shorts." },
    ],
    engines: [
      { name: "Wan", note: "Self-host / GPU", status: "Pregătit pentru conectare" },
      { name: "LTX", note: "Self-host / GPU", status: "Pregătit pentru conectare" },
      { name: "External API", note: "Cel mai rapid prototip", status: "Opțional" },
    ],
    heroLead: "Regizează ideea.",
    heroAccent: "Construiește filmul.",
    directorInput: "Input pentru Director",
    localNoCost: "LOCAL · FĂRĂ COST DE GENERARE",
    heroBody:
      "Primul strat ORBYVEN Video AI transformă un brief de business într-un storyboard pregătit pentru producție: scene, ritm, cameră, tranziții și prompturi de randare.",
    steps: [
      ["01", "Director", "Înțelege obiectivul comercial."],
      ["02", "Storyboard", "Construiește direcția de mișcare scenă cu scenă."],
      ["03", "Randare", "Pregătit pentru Wan, LTX sau un motor API."],
    ],
    panelEyebrow: "DIRECTOR AI",
    panelTitle: "Descrie rezultatul, nu promptul tehnic.",
    creativeBrief: "Brief creativ",
    briefPlaceholder: "Exemplu: Creează un film premium de lansare de 30 de secunde...",
    duration: "Durată",
    format: "Format",
    direction: "Direcție",
    directorReady: "Directorul este pregătit.",
    directorNote: "ORBYVEN va genera o direcție coerentă pentru întregul video, nu scene izolate.",
    generateDirection: "Generează direcția",
    generatedDirection: "Direcție generată",
    scenesSuffix: "scene.",
    visualSystem: "Un singur sistem vizual.",
    copyAll: "Copiază toate prompturile",
    copied: "Copiat",
    scene: "Scena",
    end: "Final",
    camera: "Cameră",
    transition: "Tranziție",
    generationPrompt: "Prompt de generare",
    copy: "Copiază",
    renderEngine: "Motor de randare",
    renderTitle: "Directorul este gata.",
    renderAccent: "Urmează randarea.",
    renderBody:
      "Interfața și contractul scenelor nu depind de provider. Putem conecta un model GPU local sau temporar un API fără să reconstruim produsul.",
    connected: "Conectat",
    selectedMissingEndpoint: "Selectat · endpoint lipsă",
    referenceLabel: "URL video de referință · opțional",
    referenceNote:
      "Este salvat în contractul de randare ca referință creativă. Workerul decide dacă poate inspecta sau folosi sursa.",
    renderJob: "Job de randare",
    openGenerated: "Deschide video-ul generat ↗",
    downloadPackage: "Descarcă pachetul de randare",
    preparing: "Se pregătește…",
    renderingInProgress: "Randare în curs…",
    signInToRender: "Autentifică-te pentru randare",
    generateFinalVideo: "Generează video final",
    preparePackage: "Pregătește pachetul de randare",
    noGpuCost: "Fără cost GPU",
    loginRequired: "Login necesar",
    renderStatusUnavailable: "Statusul randării nu este disponibil.",
    historyUnavailable: "Istoricul randărilor nu este disponibil.",
    renderJobCreateFailed: "Jobul de randare nu a putut fi creat.",
  },
  en: {
    defaultBrief:
      "Create a premium ORBYVEN Creative launch video that moves fluidly through Homepage, Templates, AI Web Design, Dashboard, connected modules and AI actions. Keep the real ORBYVEN product recognizable, use minimal text and cinematic continuous transitions.",
    styleOptions: [
      { value: "product", label: "Product launch", detail: "Precise, premium, product-first." },
      { value: "cinematic", label: "Cinematic", detail: "More atmosphere, depth and camera movement." },
      { value: "minimal-ui", label: "UI showcase", detail: "Sharper focus on the real interface." },
      { value: "social", label: "Social", detail: "Faster retention for Reels, TikTok and Shorts." },
    ],
    engines: [
      { name: "Wan", note: "Self-host / GPU", status: "Ready to connect" },
      { name: "LTX", note: "Self-host / GPU", status: "Ready to connect" },
      { name: "External API", note: "Fastest prototype", status: "Optional" },
    ],
    heroLead: "Direct the idea.",
    heroAccent: "Build the film.",
    directorInput: "Director input",
    localNoCost: "LOCAL · NO GENERATION COST",
    heroBody:
      "The first ORBYVEN Video AI layer turns a business brief into a production-ready storyboard: scenes, pacing, camera, transitions and render prompts.",
    steps: [
      ["01", "Director", "Understands the commercial goal."],
      ["02", "Storyboard", "Builds scene-by-scene motion direction."],
      ["03", "Render layer", "Prepared for Wan, LTX or an API engine."],
    ],
    panelEyebrow: "AI DIRECTOR",
    panelTitle: "Describe the result, not the technical prompt.",
    creativeBrief: "Creative brief",
    briefPlaceholder: "Example: Create a 30-second premium launch film...",
    duration: "Duration",
    format: "Format",
    direction: "Direction",
    directorReady: "The director is ready.",
    directorNote: "ORBYVEN will generate one coherent direction for the whole video, not isolated scenes.",
    generateDirection: "Generate direction",
    generatedDirection: "Generated direction",
    scenesSuffix: "scenes.",
    visualSystem: "One visual system.",
    copyAll: "Copy all prompts",
    copied: "Copied",
    scene: "Scene",
    end: "End",
    camera: "Camera",
    transition: "Transition",
    generationPrompt: "Generation prompt",
    copy: "Copy",
    renderEngine: "Render engine",
    renderTitle: "The director is ready.",
    renderAccent: "Rendering comes next.",
    renderBody:
      "The interface and scene contract are provider-independent. We can attach a local GPU model or a temporary API without rebuilding the product.",
    connected: "Connected",
    selectedMissingEndpoint: "Selected · endpoint missing",
    referenceLabel: "Reference video URL · optional",
    referenceNote:
      "Saved in the render contract as creative reference. The render worker decides whether it can inspect or use the source.",
    renderJob: "Render job",
    openGenerated: "Open generated video ↗",
    downloadPackage: "Download render package",
    preparing: "Preparing…",
    renderingInProgress: "Rendering in progress…",
    signInToRender: "Sign in to render",
    generateFinalVideo: "Generate final video",
    preparePackage: "Prepare render package",
    noGpuCost: "No GPU cost",
    loginRequired: "Login required",
    renderStatusUnavailable: "Render status unavailable.",
    historyUnavailable: "History unavailable.",
    renderJobCreateFailed: "Render job could not be created.",
  },
};

export function getVideoAiCopy(locale: VideoLocale) {
  return copy[locale];
}
