#!/usr/bin/env node
/**
 * Claude-PIPE — Kling 3.0 image-to-video animator
 *
 * Prend les images générées par Replicate et les anime via Kling 3.0.
 * Lit les URLs depuis output/replicate-urls.txt
 * Lit les motion prompts depuis le fichier config
 * Sauvegarde les URLs vidéo dans output/kling-urls.txt
 *
 * Usage:
 *   node animate-images.js --config configs/pub-obsidian.json
 *   node animate-images.js --urls "url1,url2" --motion "motion1|motion2"
 */

require("dotenv").config();
const Replicate = require("replicate");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// ─── Shotstack Ingest (URLs permanentes) ──────────────────────────────────────

const SHOTSTACK_INGEST = {
  sandbox: "https://api.shotstack.io/ingest/stage",
  production: "https://api.shotstack.io/ingest/v1",
};

async function ingestToShotstack(videoUrl, env = "sandbox") {
  const apiKey =
    env === "production"
      ? process.env.SHOTSTACK_API_KEY_PRODUCTION
      : process.env.SHOTSTACK_API_KEY_SANDBOX;

  if (!apiKey) {
    console.log(`  WARN: SHOTSTACK_API_KEY_${env.toUpperCase()} absent — ingest ignoré`);
    return null;
  }

  try {
    // Soumettre l'URL à l'ingest Shotstack
    const submitRes = await fetch(`${SHOTSTACK_INGEST[env]}/sources`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ url: videoUrl }),
    });

    if (!submitRes.ok) {
      const t = await submitRes.text();
      console.log(`  WARN: Ingest submit failed (${submitRes.status}): ${t}`);
      return null;
    }

    const submitData = await submitRes.json();
    const sourceId = submitData.data?.id;
    if (!sourceId) return null;

    console.log(`  Ingest soumis: ${sourceId}`);

    // Polling jusqu'à "ready"
    for (let attempt = 0; attempt < 24; attempt++) {
      await new Promise((r) => setTimeout(r, 5000));
      const pollRes = await fetch(`${SHOTSTACK_INGEST[env]}/sources/${sourceId}`, {
        headers: { "x-api-key": apiKey },
      });
      if (!pollRes.ok) continue;
      const pollData = await pollRes.json();
      const status = pollData.data?.attributes?.status;
      const cdnUrl = pollData.data?.attributes?.url;
      console.log(`  Ingest [${sourceId}] → ${status}`);
      if (status === "ready" && cdnUrl) {
        console.log(`  CDN URL: ${cdnUrl}`);
        return cdnUrl;
      }
      if (status === "failed") {
        console.log(`  WARN: Ingest échoué pour ${sourceId}`);
        return null;
      }
    }
    console.log(`  WARN: Ingest timeout pour ${sourceId}`);
    return null;
  } catch (err) {
    console.log(`  WARN: Ingest error: ${err.message}`);
    return null;
  }
}

// ─── Kling model IDs ──────────────────────────────────────────────────────────

const KLING_MODELS = {
  "kling-3.0": "kwaivgi/kling-v2.1-pro",   // kling-3.0 n'existe pas sur Replicate → fallback v2.1-pro
  "kling-v2.1-pro": "kwaivgi/kling-v2.1-pro",
  "kling-v2.1": "kwaivgi/kling-v2.1",
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

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    proto
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

function resolveUrl(raw) {
  if (typeof raw === "string") return raw;
  if (raw && typeof raw.url === "function") return raw.url().toString();
  if (raw && typeof raw.toString === "function") return raw.toString();
  return String(raw);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    console.error("ERROR: REPLICATE_API_TOKEN not set.");
    process.exit(1);
  }

  const client = new Replicate({ auth: token });
  const cli = parseArgs();

  // ── Charger la config ──────────────────────────────────────────────────────
  let config = {};
  if (cli.config && fs.existsSync(cli.config)) {
    config = JSON.parse(fs.readFileSync(cli.config, "utf8"));
  }

  const klingConfig = config.kling || {};
  const modelKey = klingConfig.model || "kling-3.0";
  const modelId = KLING_MODELS[modelKey] || KLING_MODELS["kling-3.0"];
  const duration = klingConfig.duration || 5;
  const aspectRatio = klingConfig.aspectRatio || "9:16";
  const negativePrompt = klingConfig.negativePrompt || "blurry, shaky, low quality";
  const outputDir = config.outputDir || "output";

  fs.mkdirSync(outputDir, { recursive: true });

  // ── Récupérer les URLs d'images ────────────────────────────────────────────
  let imageUrls = [];

  if (cli.urls) {
    imageUrls = cli.urls.split(",").map((u) => u.trim()).filter(Boolean);
  } else {
    const urlsFile = path.join(outputDir, "replicate-urls.txt");
    if (!fs.existsSync(urlsFile)) {
      console.error(`ERROR: ${urlsFile} introuvable. Lance d'abord generate-images.js.`);
      process.exit(1);
    }
    imageUrls = fs.readFileSync(urlsFile, "utf8").split("\n").map((u) => u.trim()).filter(Boolean);
  }

  if (imageUrls.length === 0) {
    console.error("ERROR: Aucune URL d'image trouvée.");
    process.exit(1);
  }

  // ── Récupérer les motion prompts depuis la config ──────────────────────────
  let motionPrompts = [];

  if (cli.motion) {
    motionPrompts = cli.motion.split("|");
  } else if (config.requests) {
    motionPrompts = config.requests
      .filter((r) => r.motionPrompt)
      .map((r) => r.motionPrompt);
  }

  console.log(`\nClaude-PIPE — Kling 3.0 Image-to-Video`);
  console.log(`  Model: ${modelId}`);
  console.log(`  Images: ${imageUrls.length}`);
  console.log(`  Duration: ${duration}s | Aspect: ${aspectRatio}\n`);

  const videoUrls = [];

  for (let i = 0; i < imageUrls.length; i++) {
    // Délai entre requêtes pour éviter le rate limit Replicate (429)
    if (i > 0) {
      console.log(`  Attente 15s (rate limit)...`);
      await new Promise((r) => setTimeout(r, 15000));
    }

    const imageUrl = imageUrls[i];
    const motionPrompt = motionPrompts[i] || `Cinematic slow motion, smooth camera movement, dramatic atmospheric lighting, ultra high quality`;

    console.log(`[${i + 1}/${imageUrls.length}] Scène ${i + 1}`);
    console.log(`  Image: ${imageUrl.slice(0, 80)}...`);
    console.log(`  Motion: ${motionPrompt.slice(0, 80)}...`);

    try {
      const input = {
        prompt: motionPrompt,
        start_image: imageUrl,
        duration: duration,
        aspect_ratio: aspectRatio,
        negative_prompt: negativePrompt,
        cfg_scale: 0.5,
      };

      const output = await client.run(modelId, { input });
      const rawUrl = Array.isArray(output) ? output[0] : output;
      const videoUrl = resolveUrl(rawUrl);

      console.log(`  Video URL: ${videoUrl}`);

      if (videoUrl && videoUrl.startsWith("http")) {
        // Ingest immédiat sur Shotstack CDN (URL permanente)
        const shotstackEnv = config.shotstack?.env || "sandbox";
        console.log(`  Ingest Shotstack (${shotstackEnv})...`);
        const cdnUrl = await ingestToShotstack(videoUrl, shotstackEnv);
        const finalUrl = cdnUrl || videoUrl;
        videoUrls.push({ url: finalUrl, type: "video" });

        // Télécharger le clip en local
        const filename = `scene-${i + 1}-${Date.now()}.mp4`;
        const dest = path.join(outputDir, filename);
        await downloadFile(videoUrl, dest);
        console.log(`  Saved: ${dest}`);
      } else {
        console.error(`  WARN: URL inattendue — fallback image`);
        videoUrls.push({ url: imageUrl, type: "image" });
      }
    } catch (err) {
      console.error(`  ERROR Kling scène ${i + 1}: ${err.message}`);
      // Fallback image — Shotstack utilisera l'image avec Ken Burns
      videoUrls.push({ url: imageUrl, type: "image" });
    }
  }

  // Sauvegarder les URLs + metadata type pour Shotstack
  const videoUrlsFile = path.join(outputDir, "kling-urls.txt");
  const metaFile = path.join(outputDir, "kling-meta.json");
  fs.writeFileSync(videoUrlsFile, videoUrls.map((v) => v.url).join("\n"));
  fs.writeFileSync(metaFile, JSON.stringify(videoUrls, null, 2));
  console.log(`\n  URLs sauvegardées: ${videoUrlsFile} (${videoUrls.length})`);
  console.log(`  Metadata: ${metaFile}`);
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
