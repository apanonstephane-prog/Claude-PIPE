#!/usr/bin/env node
/**
 * Claude-PIPE — CLI / GitHub Actions script
 * Usage:
 *   node generate-images.js                          # uses media-config.json
 *   node generate-images.js --prompt "..." --type image
 *   node generate-images.js --config custom.json
 *
 * Env vars:
 *   REPLICATE_API_TOKEN  (required)
 */

require("dotenv").config();
const Replicate = require("replicate");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// ─── Image / video model IDs ───────────────────────────────────────────────

const IMAGE_MODELS = {
  "flux-schnell": "black-forest-labs/flux-schnell",
  "flux-dev": "black-forest-labs/flux-dev",
  sdxl: "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e0ccecb3c9816de99b8191625",
  // Google DeepMind — Gemini Image models
  "nano-banana-pro": "google/nano-banana-pro",
  "nano-banana-2": "google/nano-banana-2",
};

const VIDEO_MODELS = {
  "ltx-video": "lightricks/ltx-video",
  "video-01": "minimax/video-01",
  // Kling AI (Kuaishou) — video generation
  "kling-v2.1": "kwaivgi/kling-v2.1",
  "kling-v2.1-pro": "kwaivgi/kling-v2.1-pro",
  "kling-3.0": "kwaivgi/kling-3.0",
};

const STYLE_MODIFIERS = {
  cinematic: "cinematic shot, dramatic lighting, film grain, widescreen aspect ratio, movie still",
  photorealistic: "photorealistic, ultra-detailed, 8k resolution, real photograph, natural lighting",
  documentary: "documentary photography, candid shot, journalistic style, natural light, raw authentic",
  abstract: "abstract art, bold geometric shapes, vivid colors, modern design, conceptual",
  poster: "poster design, bold typography space, high contrast, graphic design, print-ready",
  illustration: "digital illustration, artistic style, detailed artwork, vibrant colors, professional design",
  logo: "logo design, clean vector style, minimal, professional brand identity, scalable",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      result[key] = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
    }
  }
  return result;
}

function enrichPrompt(prompt, style) {
  if (!style || style === "auto" || !STYLE_MODIFIERS[style]) return prompt;
  return `${prompt}, ${STYLE_MODIFIERS[style]}`;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(url, (res) => {
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    console.error("ERROR: REPLICATE_API_TOKEN not set. Create a .env file or export the variable.");
    process.exit(1);
  }

  const client = new Replicate({ auth: token });
  const cli = parseArgs();

  // Determine config source
  let requests = [];

  if (cli.prompt) {
    // Single request from CLI args
    requests.push({
      type: cli.type || "image",
      prompt: cli.prompt,
      model: cli.model || (cli.type === "video" ? "ltx-video" : "flux-schnell"),
      style: cli.style || "illustration",
      width: parseInt(cli.width || "1024"),
      height: parseInt(cli.height || "1024"),
      numOutputs: parseInt(cli.outputs || "1"),
      duration: parseInt(cli.duration || "5"),
      outputDir: cli.output || "output",
    });
  } else {
    // Load from config file
    const configPath = cli.config || "media-config.json";
    if (!fs.existsSync(configPath)) {
      console.error(`Config file not found: ${configPath}`);
      console.error("Use --prompt to pass a prompt directly, or create media-config.json");
      process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const outputDir = config.outputDir || "output";
    requests = (config.requests || []).map((r) => ({ outputDir, ...r }));
  }

  if (requests.length === 0) {
    console.error("No generation requests found.");
    process.exit(1);
  }

  console.log(`\nClaude-PIPE — Generating ${requests.length} item(s)...\n`);

  for (const req of requests) {
    const isVideo = req.type === "video";
    const models = isVideo ? VIDEO_MODELS : IMAGE_MODELS;
    const modelKey = req.model || (isVideo ? "ltx-video" : "flux-schnell");
    const modelId = models[modelKey];

    if (!modelId) {
      console.error(`Unknown model: ${modelKey}`);
      continue;
    }

    const enriched = enrichPrompt(req.prompt, req.style);
    const outputDir = req.outputDir || "output";
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`[${req.type.toUpperCase()}] ${req.prompt.slice(0, 60)}...`);
    console.log(`  Model: ${modelId} | Style: ${req.style || "auto"}`);

    const input = isVideo
      ? {
          prompt: enriched,
          duration: req.duration || 5,
          width: req.width || 1280,
          height: req.height || 720,
        }
      : {
          prompt: enriched,
          num_outputs: req.numOutputs || 1,
          ...(modelKey !== "flux-schnell" && {
            width: req.width || 1024,
            height: req.height || 1024,
          }),
        };

    try {
      const output = await client.run(modelId, { input });
      const urls = Array.isArray(output) ? output : [output];

      for (let i = 0; i < urls.length; i++) {
        const ext = isVideo ? "mp4" : "png";
        const filename = `${Date.now()}-${i + 1}.${ext}`;
        const dest = path.join(outputDir, filename);

        if (typeof urls[i] === "string" && urls[i].startsWith("http")) {
          await downloadFile(urls[i], dest);
          console.log(`  Saved: ${dest}`);
        } else {
          console.log(`  URL: ${urls[i]}`);
        }
      }
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
