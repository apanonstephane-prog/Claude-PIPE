import Replicate from "replicate";
import {
  buildNanoBananaPrompt,
  buildKling3Prompt,
  CINEMA_MODIFIERS,
  MasterPromptOptions,
} from "./master-prompt";

export { buildNanoBananaPrompt, buildKling3Prompt, MasterPromptOptions };

// ─── Types ────────────────────────────────────────────────────────────────────

export type VisualStyle =
  | "cinematic"
  | "photorealistic"
  | "documentary"
  | "abstract"
  | "poster"
  | "illustration"
  | "logo";

export type ImageModel =
  | "flux-schnell"
  | "flux-dev"
  | "sdxl"
  | "nano-banana-pro"
  | "nano-banana-2";

export type VideoModel =
  | "ltx-video"
  | "video-01"
  | "kling-v2.1"
  | "kling-v2.1-pro"
  | "kling-3.0"       // V3 — cinéma prompt-driven, jusqu'à 15s
  | "kling-3.0-omni"; // O3 — native audio + multi-shot + Elements system, jusqu'à 30s

export interface GenerationContext {
  projectName?: string;
  conversationTheme?: string;
  keywords?: string[];
  style?: VisualStyle;
  outputDir?: string;
}

export interface ImageRequest {
  prompt: string;
  model?: ImageModel;
  style?: VisualStyle;
  width?: number;
  height?: number;
  numOutputs?: number;
  context?: GenerationContext;
  /** Passer un MasterPromptOptions pour construire un prompt cinéma optimal */
  masterPrompt?: MasterPromptOptions;
}

export interface VideoRequest {
  prompt: string;
  model?: VideoModel;
  style?: VisualStyle;
  duration?: number;
  width?: number;
  height?: number;
  context?: GenerationContext;
  /** Passer un MasterPromptOptions pour construire un prompt Kling 3.0 optimal */
  masterPrompt?: MasterPromptOptions;
  /** Kling 3.0 : première frame en image-to-video */
  imageUrl?: string;
  /** Kling 3.0 Omni : image de référence pour cohérence personnage/style */
  referenceImageUrl?: string;
}

export interface MediaResult {
  type: "image" | "video";
  urls: string[];
  prompt: string;
  model: string;
  style: VisualStyle;
  generatedAt: string;
}

// ─── Model IDs ────────────────────────────────────────────────────────────────

const IMAGE_MODELS: Record<ImageModel, string> = {
  "flux-schnell": "black-forest-labs/flux-schnell",
  "flux-dev": "black-forest-labs/flux-dev",
  sdxl: "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e0ccecb3c9816de99b8191625",
  // Google DeepMind — Gemini Image models
  "nano-banana-pro": "google/nano-banana-pro",
  "nano-banana-2": "google/nano-banana-2",
};

const VIDEO_MODELS: Record<VideoModel, string> = {
  "ltx-video": "lightricks/ltx-video",
  "video-01": "minimax/video-01",
  // Kling AI (Kuaishou) — video generation
  "kling-v2.1": "kwaivgi/kling-v2.1",
  "kling-v2.1-pro": "kwaivgi/kling-v2.1-pro",
  "kling-3.0": "kwaivgi/kling-v3-video",           // V3 — cinéma prompt-driven, 15s max
  "kling-3.0-omni": "kwaivgi/kling-v3-omni-video", // O3 — audio natif + Elements, 15s API (30s platform)
  "kling-v3-motion": "kwaivgi/kling-v3-motion-control",
};

// ─── Style Prompts ────────────────────────────────────────────────────────────
// Utilise CINEMA_MODIFIERS depuis master-prompt pour les styles cinéma.
// Les autres styles gardent leurs modificateurs spécifiques.

const STYLE_MODIFIERS: Record<VisualStyle, string> = {
  cinematic: CINEMA_MODIFIERS.cinematic,
  photorealistic: CINEMA_MODIFIERS.photorealistic,
  documentary: CINEMA_MODIFIERS.documentary,
  abstract: CINEMA_MODIFIERS.abstract,
  poster: CINEMA_MODIFIERS.poster,
  illustration: CINEMA_MODIFIERS.illustration,
  logo: CINEMA_MODIFIERS.logo,
};

// ─── Context Analysis ─────────────────────────────────────────────────────────

export function detectStyle(context: GenerationContext): VisualStyle {
  if (context.style) return context.style;

  const text = [
    context.projectName ?? "",
    context.conversationTheme ?? "",
    ...(context.keywords ?? []),
  ]
    .join(" ")
    .toLowerCase();

  if (/film|movie|cinema|scene|shot/.test(text)) return "cinematic";
  if (/photo|portrait|landscape|real/.test(text)) return "photorealistic";
  if (/doc|report|news|journal/.test(text)) return "documentary";
  if (/abstract|art|concept|idea/.test(text)) return "abstract";
  if (/poster|banner|ad|campaign/.test(text)) return "poster";
  if (/logo|brand|icon|identity/.test(text)) return "logo";
  return "illustration";
}

export function enrichPrompt(prompt: string, style: VisualStyle): string {
  const modifier = STYLE_MODIFIERS[style];
  return `${prompt}, ${modifier}`;
}

// ─── Core Pipeline ────────────────────────────────────────────────────────────

export class ReplicateMediaPipeline {
  private client: Replicate;

  constructor(apiToken?: string) {
    const token = apiToken ?? process.env.REPLICATE_API_TOKEN;
    if (!token) {
      throw new Error(
        "REPLICATE_API_TOKEN is required. Set it in .env or pass it directly."
      );
    }
    this.client = new Replicate({ auth: token });
  }

  async generateImage(request: ImageRequest): Promise<MediaResult> {
    const model = request.model ?? "flux-schnell";
    const style = request.style ?? detectStyle(request.context ?? {});
    const modelId = IMAGE_MODELS[model];

    // masterPrompt prend la priorité sur le prompt texte brut
    const isGoogleModel = model === "nano-banana-pro" || model === "nano-banana-2";
    const enriched = request.masterPrompt
      ? buildNanoBananaPrompt(request.masterPrompt)
      : enrichPrompt(request.prompt, style);

    const input: Record<string, unknown> = isGoogleModel
      ? {
          prompt: enriched,
          aspect_ratio: request.masterPrompt?.ratio ?? "16:9",
          number_of_images: request.numOutputs ?? 1,
          output_format: "png",
          safety_filter_level: "block_only_high",
        }
      : {
          prompt: enriched,
          num_outputs: request.numOutputs ?? 1,
          ...(model !== "flux-schnell" && {
            width: request.width ?? 1024,
            height: request.height ?? 1024,
          }),
        };

    const output = await this.client.run(modelId as `${string}/${string}`, {
      input,
    });

    const urls = Array.isArray(output)
      ? (output as string[])
      : [output as string];

    return {
      type: "image",
      urls,
      prompt: enriched,
      model: modelId,
      style,
      generatedAt: new Date().toISOString(),
    };
  }

  async generateVideo(request: VideoRequest): Promise<MediaResult> {
    const model = request.model ?? "ltx-video";
    const style = request.style ?? detectStyle(request.context ?? {});
    const modelId = VIDEO_MODELS[model];

    // masterPrompt prend la priorité — Kling 3.0 V3/O3 supporte multi-shot et Elements
    const isKling3 = model === "kling-3.0" || model === "kling-3.0-omni";
    const isKlingOmni = model === "kling-3.0-omni";
    const enriched = request.masterPrompt
      ? buildKling3Prompt(request.masterPrompt)
      : enrichPrompt(request.prompt, style);

    const duration = request.masterPrompt?.duration ?? request.duration ?? 5;
    const mp = request.masterPrompt;

    // Elements O3 : si des personnages de référence sont définis
    const elementImages = isKlingOmni && mp?.elements
      ? mp.elements.reduce<Record<string, string[]>>((acc, el) => {
          acc[el.tag] = el.imageUrls;
          return acc;
        }, {})
      : undefined;

    const characterOrientation = isKlingOmni && mp?.elements?.[0]?.characterOrientation;

    // multi_shots activé automatiquement si le masterPrompt contient des shots
    const hasMultiShots = isKling3 && mp?.shots && mp.shots.length > 1;

    const input: Record<string, unknown> = {
      prompt: enriched,
      duration,
      ...(isKling3
        ? {
            aspect_ratio: mp?.ratio ?? "16:9",
            mode: "pro",
            multi_shots: hasMultiShots ?? false,
            sound: mp?.generateAudio ?? false,
            ...(request.imageUrl && { image: request.imageUrl }),
            ...(isKlingOmni && {
              ...(request.referenceImageUrl && { reference_image: request.referenceImageUrl }),
              ...(elementImages && { elements: elementImages }),
              ...(characterOrientation && { character_orientation: characterOrientation }),
            }),
          }
        : {
            width: request.width ?? 1280,
            height: request.height ?? 720,
          }),
    };

    const output = await this.client.run(modelId as `${string}/${string}`, {
      input,
    });

    const urls = Array.isArray(output)
      ? (output as string[])
      : [output as string];

    return {
      type: "video",
      urls,
      prompt: enriched,
      model: modelId,
      style,
      generatedAt: new Date().toISOString(),
    };
  }

  async batch(
    requests: (ImageRequest | VideoRequest)[],
    type: "image" | "video"
  ): Promise<MediaResult[]> {
    const results: MediaResult[] = [];
    for (const req of requests) {
      const result =
        type === "image"
          ? await this.generateImage(req as ImageRequest)
          : await this.generateVideo(req as VideoRequest);
      results.push(result);
    }
    return results;
  }
}

// ─── Singleton factory ────────────────────────────────────────────────────────

let _pipeline: ReplicateMediaPipeline | null = null;

export function getPipeline(apiToken?: string): ReplicateMediaPipeline {
  if (!_pipeline) {
    _pipeline = new ReplicateMediaPipeline(apiToken);
  }
  return _pipeline;
}
