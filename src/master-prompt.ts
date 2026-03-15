/**
 * master-prompt.ts — Constructeur de prompts cinéma optimaux
 *
 * Basé sur : géométrie sacrée, cybernétique visuelle, Laban movement,
 * color science 300M, spécificités nano-banana-pro et Kling 3.0.
 *
 * Principe : densité maximale d'intention, économie maximale de mots.
 * Max 3 éléments par couche. Au-delà = entropie.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompositionGrid = "phi" | "fibonacci" | "thirds" | "centered" | "symmetrical";

export type CameraBody =
  | "ARRI Alexa 35"
  | "ARRI Alexa Mini LF"
  | "RED V-RAPTOR"
  | "Sony VENICE 2"
  | "Hasselblad X2D"
  | "Phase One IQ4 150MP"
  | "Leica M11";

export type CinematicLens =
  | "Zeiss Supreme Prime 21mm T1.5"
  | "Zeiss Supreme Prime 29mm T2.0"
  | "Zeiss Supreme Prime 47mm T2.0"
  | "ARRI Signature Prime 47mm T1.8"
  | "Cooke S7/i 75mm T2.0"
  | "Leica Summilux-M 35mm f/1.4"
  | "Zeiss Otus 55mm f/1.4";

export type DPReference =
  | "Roger Deakins — Blade Runner 2049"
  | "Greig Fraser — Dune"
  | "Emmanuel Lubezki — The Revenant"
  | "Hoyte van Hoytema — Dunkirk"
  | "Bradford Young — Arrival"
  | "Robert Richardson — Inglourious Basterds";

export type FilmStock =
  | "Kodak Vision3 250D"
  | "Kodak Vision3 500T"
  | "Fujifilm Eterna 500"
  | "ARRI LogC3"
  | "RED RAW IPP2";

export type CameraMove =
  | "slow push in"
  | "pull back reveal"
  | "dolly left"
  | "dolly right"
  | "crane up"
  | "crane down"
  | "slow pan left"
  | "slow pan right"
  | "tilt up"
  | "tilt down"
  | "orbit around subject"
  | "rack focus foreground to subject"
  | "natural camera breathing"
  | "handheld with intention"
  | "locked off static";

export type AspectRatio =
  | "16:9"
  | "21:9"   // scope / cinemascope
  | "4:3"
  | "1:1"
  | "9:16"   // vertical
  | "3:2";

// ─── Interfaces de construction ────────────────────────────────────────────────

export interface CompositionSpec {
  grid: CompositionGrid;
  subjectPosition: string;   // ex: "lower-right intersection", "eye of fibonacci spiral"
  depthLayers?: string;      // ex: "sharp foreground, focused subject, soft horizon"
}

export interface LightSpec {
  source: string;            // ex: "single practical window", "golden hour ambient"
  direction: string;         // ex: "45° from left, slightly above"
  quality: string;           // ex: "soft wrap", "hard directional", "diffuse overcast"
  effect?: string;           // ex: "skin catches warm light, no harsh shadows"
}

export interface ColorSpec {
  dominants: [string, string, string];   // 3 couleurs nommées précisément
  dp: DPReference;
  filmStock?: FilmStock;
}

export interface TechSpec {
  camera: CameraBody;
  lens: CinematicLens;
  aperture?: string;          // ex: "T2.0", "wide open"
  dof?: string;               // ex: "shallow, subject sharp, background falls off"
}

export interface ShotSpec {
  timeIn: number;             // secondes
  timeOut: number;
  description: string;
  cameraMove: CameraMove;
  isCref?: boolean;
  isLipsync?: boolean;
}

// ─── Interface principale ──────────────────────────────────────────────────────

/**
 * Elements Kling 3.0 O3 — Verrouillage d'identité de personnage.
 * Référencés dans le prompt avec la syntaxe @Element1, @Element2...
 * Jusqu'à 3 images par élément. Max 3 éléments par génération.
 */
export interface KlingElement {
  tag: "@Element1" | "@Element2" | "@Element3";
  /** URLs ou base64 des images de référence (1–3 images) */
  imageUrls: string[];
  name?: string;
  voiceId?: string;
  /** 'image' = orientation de la photo (max 10s) | 'video' = cohérent avec vidéo (max 30s) */
  characterOrientation?: "image" | "video";
}

export interface MasterPromptOptions {
  // Couche 1 : Ancrage
  scene: string;              // lieu, heure, univers

  // Couche 2 : Sujet
  subject: string;            // qui/quoi + état émotionnel
  signatureDetail?: string;   // le détail unique qui ancre le réel

  // Couche 3 : Composition
  composition?: CompositionSpec;

  // Couche 4 : Lumière
  light?: LightSpec;

  // Couche 5 : Couleur
  color?: ColorSpec;

  // Couche 6 : Technique
  tech?: TechSpec;

  // Couche 7 : Intention
  intention: string;          // ce que l'image dit — une phrase

  // Méta
  ratio?: AspectRatio;
  resolution?: "4K" | "2K";

  // Video uniquement (Kling 3.0)
  shots?: ShotSpec[];                // multi-shot V3 : liste ordonnée de plans
  elements?: KlingElement[];         // O3 uniquement : personnages persistants
  audioAmbience?: string;
  generateAudio?: boolean;           // O3 uniquement : génération audio native
  duration?: 5 | 10 | 15 | 30;      // 30s uniquement avec O3 + character_orientation:'video'
}

// ─── Builders ─────────────────────────────────────────────────────────────────

/**
 * Construit un prompt optimal pour nano-banana-pro.
 * Respecte la structure en 7 couches, max 3 éléments par couche.
 */
export function buildNanoBananaPrompt(opts: MasterPromptOptions): string {
  const parts: string[] = [];

  // Couche 1 — Ancrage
  parts.push(opts.scene.trim());

  // Couche 2 — Sujet + détail signature
  const subjectLine = opts.signatureDetail
    ? `${opts.subject.trim()} ${opts.signatureDetail.trim()}`
    : opts.subject.trim();
  parts.push(subjectLine);

  // Couche 3 — Composition
  if (opts.composition) {
    const { grid, subjectPosition, depthLayers } = opts.composition;
    const gridLabel =
      grid === "phi" ? "Phi grid" :
      grid === "fibonacci" ? "Fibonacci spiral" :
      grid === "thirds" ? "Rule of thirds" :
      grid === "centered" ? "Centered symmetry" :
      "Dynamic symmetry";
    let compLine = `${gridLabel}: ${subjectPosition}.`;
    if (depthLayers) compLine += ` ${depthLayers}.`;
    parts.push(compLine);
  }

  // Couche 4 — Lumière
  if (opts.light) {
    const { source, direction, quality, effect } = opts.light;
    let lightLine = `${source}. Direction: ${direction}. Quality: ${quality}.`;
    if (effect) lightLine += ` ${effect}.`;
    parts.push(lightLine);
  }

  // Couche 5 — Couleur
  if (opts.color) {
    const { dominants, dp, filmStock } = opts.color;
    const colorLine = filmStock
      ? `Palette: ${dominants[0]}, ${dominants[1]}, ${dominants[2]}. Color grade: ${dp}. Film stock: ${filmStock}.`
      : `Palette: ${dominants[0]}, ${dominants[1]}, ${dominants[2]}. Color grade: ${dp}.`;
    parts.push(colorLine);
  }

  // Couche 6 — Technique
  if (opts.tech) {
    const { camera, lens, aperture, dof } = opts.tech;
    const techLine = [
      `Shot on ${camera}, ${lens}`,
      aperture ? `${aperture}` : null,
      dof ? `${dof}` : null,
    ].filter(Boolean).join(". ") + ".";
    parts.push(techLine);
  }

  // Couche 7 — Intention
  parts.push(opts.intention.trim());

  // Méta
  const resolution = opts.resolution ?? "4K";
  const ratio = opts.ratio ?? "16:9";
  parts.push(`${resolution}, ${ratio}, photorealistic.`);

  return parts.filter(Boolean).join("\n");
}

/**
 * Construit un prompt optimal pour Kling 3.0 — plan unique ou multi-shot.
 * Supporte O3 (Omni) avec Elements system (@Element1...) pour la cohérence personnage.
 * Intègre les qualités de mouvement Laban et les mots-clés reconnus.
 */
export function buildKling3Prompt(opts: MasterPromptOptions): string {
  const parts: string[] = [];

  // Préambule Elements O3 : injecter les tags de référence personnage
  if (opts.elements && opts.elements.length > 0) {
    const elementRefs = opts.elements.map((el) => el.tag).join(", ");
    parts.push(`Characters: ${elementRefs}.`);
  }

  // Multi-shot : structure narrative
  if (opts.shots && opts.shots.length > 0) {
    for (const shot of opts.shots) {
      const shotHeader = formatShotHeader(shot);
      // Injecter le tag Element dans le plan si CREF
      const elementTag = shot.isCref && opts.elements?.[0]
        ? ` ${opts.elements[0].tag}`
        : "";
      parts.push(`${shotHeader}:${elementTag} ${shot.description.trim()}`);
      parts.push(`Camera: ${shot.cameraMove}.`);
      if (shot.isLipsync) parts.push("Lipsync: yes.");
      parts.push(""); // séparation visuelle
    }
  } else {
    // Plan unique
    parts.push(opts.scene.trim());
    parts.push(opts.subject.trim());
    if (opts.signatureDetail) parts.push(opts.signatureDetail.trim());
  }

  // Lumière
  if (opts.light) {
    const { source, direction, quality } = opts.light;
    parts.push(`Lighting: ${source}, ${direction}, ${quality}.`);
  }

  // Couleur
  if (opts.color) {
    const { dominants, dp } = opts.color;
    parts.push(`Grade: ${dp}. Palette: ${dominants.join(", ")}.`);
  }

  // Audio
  if (opts.audioAmbience) {
    parts.push(`Audio: ${opts.audioAmbience}.`);
  }

  // Intention
  parts.push(opts.intention.trim());

  // Méta
  const ratio = opts.ratio ?? "16:9";
  const duration = opts.duration ?? 10;
  parts.push(`4K HDR, ${ratio}, ${duration}s.`);

  return parts.filter(Boolean).join("\n");
}

function formatShotHeader(shot: ShotSpec): string {
  const label =
    shot.timeIn === 0 ? "OPENING SHOT" :
    shot.timeOut >= 13 ? "CLOSE ON" :
    "CUT TO";
  return `${label} (${shot.timeIn}–${shot.timeOut}s)`;
}

/**
 * Enrichit un prompt existant avec les modificateurs de style cinéma.
 * Utilisé par enrichPrompt dans replicate-media.ts.
 */
export const CINEMA_MODIFIERS: Record<string, string> = {
  cinematic:
    "cinematic composition, phi grid framing, practical lighting, film grain, " +
    "Kodak Vision3 color science, ARRI Alexa, 4K, 2.39:1",
  photorealistic:
    "photorealistic, natural lighting, medium depth of field, " +
    "Hasselblad medium format, 4K, sharp throughout",
  documentary:
    "documentary, natural available light, handheld with intention, " +
    "journalistic framing, candid, Kodak color palette",
  abstract:
    "abstract composition, bold geometric forms, phi ratio, " +
    "deliberate color palette, graphic clarity",
  poster:
    "poster composition, strong visual hierarchy, high contrast, " +
    "typographic space reserved, print quality",
  illustration:
    "digital illustration, clean linework, coherent palette, " +
    "professional finish, scalable detail",
  logo:
    "logo design, vector-clean, minimal, centered symmetry, " +
    "single dominant color, professional identity",
};

// ─── DP Style Presets ─────────────────────────────────────────────────────────
// Prêts à injecter dans un ColorSpec.dp

export const DP_PRESETS: Record<string, Partial<ColorSpec>> = {
  deakins_br2049: {
    dp: "Roger Deakins — Blade Runner 2049",
    dominants: ["deep blue-green shadows", "warm amber midtones", "pale gold highlights"],
    filmStock: "ARRI LogC3",
  },
  fraser_dune: {
    dp: "Greig Fraser — Dune",
    dominants: ["bleach bypass texture", "sand gold highlights", "cold blue shadows"],
    filmStock: "RED RAW IPP2",
  },
  lubezki_revenant: {
    dp: "Emmanuel Lubezki — The Revenant",
    dominants: ["natural warm interior", "cold blue exterior", "warm earth midtones"],
    filmStock: "Kodak Vision3 250D",
  },
  hoytema_dunkirk: {
    dp: "Hoyte van Hoytema — Dunkirk",
    dominants: ["cold steel blue", "warm grey", "hard light accents"],
    filmStock: "Kodak Vision3 500T",
  },
  young_arrival: {
    dp: "Bradford Young — Arrival",
    dominants: ["near-monochrome desaturation", "diffuse halos", "cool neutral highlights"],
    filmStock: "Fujifilm Eterna 500",
  },
};
