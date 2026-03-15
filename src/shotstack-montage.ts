/**
 * Shotstack — Video montage assembly
 * Assembles images/video clips into a final MP4 via the Shotstack API.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShotstackEnv = "sandbox" | "production";

export interface ClipSource {
  type: "image" | "video";
  url: string;
  /** Duration in seconds for this clip */
  duration: number;
  /** Optional Ken Burns effect for images */
  effect?: "zoomIn" | "zoomOut" | "slideLeft" | "slideRight";
}

export interface TextOverlay {
  text: string;
  start: number;
  duration: number;
  fontSize?: number;
  fontColor?: string;
  position?: "top" | "center" | "bottom" | "topLeft" | "bottomRight";
  style?: "minimal" | "future" | "blockbuster" | "vogue" | "sketchy" | "skinny" | "chunk" | "chunkLight" | "marker" | "simple" | "neon" | "dreamland" | "white";
}

export interface MontageConfig {
  clips: ClipSource[];
  textOverlays?: TextOverlay[];
  /** Soundtrack URL (mp3) — optionnel */
  soundtrack?: string;
  /** Volume de la musique 0–1 */
  soundtrackVolume?: number;
  transition?: "fade" | "wipeLeft" | "wipeRight" | "slideLeft" | "slideRight" | "carouselLeft" | "carouselRight" | "zoom" | "fadeSlow" | "fadeWhite";
  resolution?: "preview" | "mobile" | "sd" | "hd" | "1080";
  fps?: 24 | 25 | 30;
}

export interface RenderResult {
  renderId: string;
  status: "queued" | "fetching" | "rendering" | "saving" | "done" | "failed";
  url?: string;
  env: ShotstackEnv;
}

// ─── Shotstack API endpoints ───────────────────────────────────────────────────

const ENDPOINTS: Record<ShotstackEnv, string> = {
  sandbox: "https://api.shotstack.io/stage/render",
  production: "https://api.shotstack.io/v1/render",
};

const STATUS_ENDPOINTS: Record<ShotstackEnv, string> = {
  sandbox: "https://api.shotstack.io/stage/render",
  production: "https://api.shotstack.io/v1/render",
};

// ─── Client ────────────────────────────────────────────────────────────────────

export class ShotstackClient {
  private apiKey: string;
  private env: ShotstackEnv;

  constructor(apiKey?: string, env: ShotstackEnv = "sandbox") {
    const key =
      apiKey ??
      (env === "production"
        ? process.env.SHOTSTACK_API_KEY_PRODUCTION
        : process.env.SHOTSTACK_API_KEY_SANDBOX);
    if (!key) {
      throw new Error(
        `SHOTSTACK_API_KEY_${env.toUpperCase()} is required. Set it in .env or pass it directly.`
      );
    }
    this.apiKey = key;
    this.env = env;
  }

  /** Build the Shotstack timeline payload from a MontageConfig */
  private buildPayload(config: MontageConfig): object {
    const transition = config.transition ?? "fade";
    let currentTime = 0;

    // Video/image track
    const mediaClips = config.clips.map((clip) => {
      const start = currentTime;
      currentTime += clip.duration;

      const asset =
        clip.type === "image"
          ? {
              type: "image",
              src: clip.url,
            }
          : {
              type: "video",
              src: clip.url,
            };

      const clipObj: Record<string, unknown> = {
        asset,
        start,
        length: clip.duration,
        transition: {
          in: transition,
          out: transition,
        },
      };

      if (clip.type === "image" && clip.effect) {
        clipObj.effect = clip.effect;
      }

      return clipObj;
    });

    const totalDuration = currentTime;

    // Text overlay track
    const textClips = (config.textOverlays ?? []).map((overlay) => ({
      asset: {
        type: "title",
        text: overlay.text,
        style: overlay.style ?? "minimal",
        color: overlay.fontColor ?? "#ffffff",
        size: overlay.fontSize ?? 40,
        position: overlay.position ?? "bottom",
      },
      start: overlay.start,
      length: overlay.duration,
      transition: {
        in: "fade",
        out: "fade",
      },
    }));

    const tracks: object[] = [{ clips: mediaClips }];
    if (textClips.length > 0) {
      tracks.push({ clips: textClips });
    }

    const timeline: Record<string, unknown> = {
      background: "#000000",
      tracks,
    };

    if (config.soundtrack) {
      timeline.soundtrack = {
        src: config.soundtrack,
        effect: "fadeInFadeOut",
        volume: config.soundtrackVolume ?? 0.5,
      };
    }

    return {
      timeline,
      output: {
        format: "mp4",
        resolution: config.resolution ?? "hd",
        fps: config.fps ?? 25,
        size: {
          width: 1080,
          height: 1920,
        },
      },
    };
  }

  /** Submit a render job to Shotstack */
  async render(config: MontageConfig): Promise<RenderResult> {
    const payload = this.buildPayload(config);
    const endpoint = ENDPOINTS[this.env];

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Shotstack render failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as {
      success: boolean;
      message: string;
      response: { id: string; message: string };
    };

    return {
      renderId: data.response.id,
      status: "queued",
      env: this.env,
    };
  }

  /** Poll render status until done or failed */
  async waitForRender(
    renderId: string,
    pollIntervalMs = 5000,
    timeoutMs = 300000
  ): Promise<RenderResult> {
    const endpoint = `${STATUS_ENDPOINTS[this.env]}/${renderId}`;
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, pollIntervalMs));

      const res = await fetch(endpoint, {
        headers: { "x-api-key": this.apiKey },
      });

      if (!res.ok) {
        throw new Error(`Shotstack status check failed (${res.status})`);
      }

      const data = (await res.json()) as {
        success: boolean;
        response: {
          id: string;
          status: RenderResult["status"];
          url?: string;
        };
      };

      const { status, url } = data.response;
      console.log(`  Shotstack [${renderId}] status: ${status}`);

      if (status === "done") {
        return { renderId, status, url, env: this.env };
      }
      if (status === "failed") {
        throw new Error(`Shotstack render failed for ${renderId}`);
      }
    }

    throw new Error(`Shotstack render timed out after ${timeoutMs / 1000}s`);
  }

  /** Render and wait — convenience method */
  async renderAndWait(config: MontageConfig): Promise<RenderResult> {
    const job = await this.render(config);
    console.log(`  Shotstack render queued: ${job.renderId} (${this.env})`);
    return this.waitForRender(job.renderId);
  }
}

// ─── Preset : pub cinématographique 15s ───────────────────────────────────────

export function buildObsidianAd(imageUrls: string[]): MontageConfig {
  const clips: ClipSource[] = imageUrls.map((url, i) => ({
    type: "image",
    url,
    duration: 3.5,
    effect: (["zoomIn", "zoomOut", "slideLeft", "slideRight"] as const)[i % 4],
  }));

  return {
    clips,
    textOverlays: [
      {
        text: "OBSIDIAN ARTS FILMS STUDIO",
        start: 10,
        duration: 4,
        fontSize: 48,
        fontColor: "#d4af37",
        position: "center",
        style: "future",
      },
      {
        text: "Chaque histoire mérite d'être vue.",
        start: 12,
        duration: 3,
        fontSize: 28,
        fontColor: "#ffffff",
        position: "bottom",
        style: "minimal",
      },
    ],
    transition: "fadeSlow",
    resolution: "hd",
    fps: 25,
  };
}
