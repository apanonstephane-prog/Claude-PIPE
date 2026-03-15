import Replicate from "replicate";

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
  | "kling-3.0";

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
}

export interface VideoRequest {
  prompt: string;
  model?: VideoModel;
  style?: VisualStyle;
  duration?: number;
  width?: number;
  height?: number;
  context?: GenerationContext;
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
  "kling-3.0": "kwaivgi/kling-v3-video",         // Kling Video 3.0 — jusqu'à 15s
  "kling-v3-motion": "kwaivgi/kling-v3-motion-control",
};

// ─── Style Prompts ────────────────────────────────────────────────────────────

const STYLE_MODIFIERS: Record<VisualStyle, string> = {
  cinematic:
    "cinematic shot, dramatic lighting, film grain, widescreen aspect ratio, movie still",
  photorealistic:
    "photorealistic, ultra-detailed, 8k resolution, real photograph, natural lighting",
  documentary:
    "documentary photography, candid shot, journalistic style, natural light, raw authentic",
  abstract:
    "abstract art, bold geometric shapes, vivid colors, modern design, conceptual",
  poster:
    "poster design, bold typography space, high contrast, graphic design, print-ready",
  illustration:
    "digital illustration, artistic style, detailed artwork, vibrant colors, professional design",
  logo: "logo design, clean vector style, minimal, professional brand identity, scalable",
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
    const enriched = enrichPrompt(request.prompt, style);
    const modelId = IMAGE_MODELS[model];

    const input: Record<string, unknown> = {
      prompt: enriched,
      num_outputs: request.numOutputs ?? 1,
    };

    if (model !== "flux-schnell") {
      input.width = request.width ?? 1024;
      input.height = request.height ?? 1024;
    }

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
    const enriched = enrichPrompt(request.prompt, style);
    const modelId = VIDEO_MODELS[model];

    const input: Record<string, unknown> = {
      prompt: enriched,
      duration: request.duration ?? 5,
      width: request.width ?? 1280,
      height: request.height ?? 720,
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
