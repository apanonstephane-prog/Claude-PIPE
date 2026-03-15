import { NextRequest, NextResponse } from "next/server";
import {
  getPipeline,
  ImageRequest,
  VideoRequest,
  GenerationContext,
  VisualStyle,
  ImageModel,
  VideoModel,
} from "../replicate-media";

// ─── GET /api/generate-media ──────────────────────────────────────────────────
// Returns available models, styles, and usage info

export async function GET() {
  return NextResponse.json({
    name: "Claude-PIPE — Replicate Media Pipeline",
    version: "1.0.0",
    endpoints: {
      "POST /api/generate-media": "Generate image or video via Replicate",
    },
    imageModels: ["flux-schnell", "flux-dev", "sdxl"],
    videoModels: ["ltx-video", "video-01"],
    styles: [
      "cinematic",
      "photorealistic",
      "documentary",
      "abstract",
      "poster",
      "illustration",
      "logo",
    ],
    defaults: {
      imageModel: "flux-schnell",
      videoModel: "ltx-video",
      style: "auto-detected from context",
    },
  });
}

// ─── POST /api/generate-media ─────────────────────────────────────────────────

interface GenerateMediaBody {
  type: "image" | "video";
  prompt: string;
  model?: ImageModel | VideoModel;
  style?: VisualStyle;
  width?: number;
  height?: number;
  numOutputs?: number;
  duration?: number;
  context?: GenerationContext;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateMediaBody = await req.json();

    if (!body.type || !body.prompt) {
      return NextResponse.json(
        { error: "Fields 'type' and 'prompt' are required." },
        { status: 400 }
      );
    }

    if (body.type !== "image" && body.type !== "video") {
      return NextResponse.json(
        { error: "Field 'type' must be 'image' or 'video'." },
        { status: 400 }
      );
    }

    const pipeline = getPipeline();

    if (body.type === "image") {
      const request: ImageRequest = {
        prompt: body.prompt,
        model: body.model as ImageModel | undefined,
        style: body.style,
        width: body.width,
        height: body.height,
        numOutputs: body.numOutputs,
        context: body.context,
      };
      const result = await pipeline.generateImage(request);
      return NextResponse.json(result);
    } else {
      const request: VideoRequest = {
        prompt: body.prompt,
        model: body.model as VideoModel | undefined,
        style: body.style,
        width: body.width,
        height: body.height,
        duration: body.duration,
        context: body.context,
      };
      const result = await pipeline.generateVideo(request);
      return NextResponse.json(result);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
