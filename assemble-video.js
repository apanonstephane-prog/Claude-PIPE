#!/usr/bin/env node
/**
 * Claude-PIPE — Shotstack video assembly CLI
 *
 * Usage:
 *   node assemble-video.js --urls "url1,url2,url3,url4" --preset obsidian
 *   node assemble-video.js --config configs/pub-obsidian.json --env sandbox
 *   node assemble-video.js --urls-file output/urls.txt --preset obsidian --env production
 *
 * Env vars:
 *   SHOTSTACK_API_KEY_SANDBOX     (required for sandbox)
 *   SHOTSTACK_API_KEY_PRODUCTION  (required for production)
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.close();
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// ─── Shotstack API ─────────────────────────────────────────────────────────────

const ENDPOINTS = {
  sandbox: "https://api.shotstack.io/stage/render",
  production: "https://api.shotstack.io/v1/render",
};

function buildObsidianPayload(imageUrls) {
  const effects = ["zoomIn", "zoomOut", "slideLeft", "slideRight"];
  let currentTime = 0;

  const mediaClips = imageUrls.map((url, i) => {
    const start = currentTime;
    currentTime += 3.5;
    return {
      asset: { type: "image", src: url },
      start,
      length: 3.5,
      effect: effects[i % 4],
      transition: { in: "fadeSlow", out: "fadeSlow" },
    };
  });

  return {
    timeline: {
      background: "#000000",
      tracks: [
        { clips: mediaClips },
        {
          clips: [
            {
              asset: {
                type: "title",
                text: "OBSIDIAN ARTS FILMS STUDIO",
                style: "future",
                color: "#d4af37",
                size: "x-large",
                position: "center",
              },
              start: 10,
              length: 4,
              transition: { in: "fade", out: "fade" },
            },
            {
              asset: {
                type: "title",
                text: "Chaque histoire merite d etre vue.",
                style: "minimal",
                color: "#ffffff",
                size: "medium",
                position: "bottom",
              },
              start: 12,
              length: 3,
              transition: { in: "fade", out: "fade" },
            },
          ],
        },
      ],
    },
    output: {
      format: "mp4",
      resolution: "hd",
      fps: 25,
      size: { width: 1080, height: 1920 },
    },
  };
}

function buildCustomPayload(shotstackConfig, imageUrls) {
  const effects = ["zoomIn", "zoomOut", "slideLeft", "slideRight"];
  let currentTime = 0;

  const clips = shotstackConfig.clips || imageUrls.map((url, i) => ({
    type: "image",
    url,
    duration: shotstackConfig.clipDuration || 3.5,
    effect: effects[i % 4],
  }));

  const mediaClips = clips.map((clip, i) => {
    const url = clip.url || imageUrls[i];
    const start = currentTime;
    currentTime += clip.duration || 3.5;
    return {
      asset: { type: clip.type || "image", src: url },
      start,
      length: clip.duration || 3.5,
      effect: clip.effect || effects[i % 4],
      transition: { in: shotstackConfig.transition || "fadeSlow", out: shotstackConfig.transition || "fadeSlow" },
    };
  });

  const tracks = [{ clips: mediaClips }];

  if (shotstackConfig.textOverlays) {
    tracks.push({
      clips: shotstackConfig.textOverlays.map((overlay) => ({
        asset: {
          type: "title",
          text: overlay.text,
          style: overlay.style || "minimal",
          color: overlay.fontColor || "#ffffff",
          size: overlay.fontSize || "medium",
          position: overlay.position || "bottom",
        },
        start: overlay.start,
        length: overlay.duration,
        transition: { in: "fade", out: "fade" },
      })),
    });
  }

  const timeline = { background: "#000000", tracks };
  if (shotstackConfig.soundtrack) {
    timeline.soundtrack = {
      src: shotstackConfig.soundtrack,
      effect: "fadeInFadeOut",
      volume: shotstackConfig.soundtrackVolume || 0.5,
    };
  }

  return {
    timeline,
    output: {
      format: "mp4",
      resolution: shotstackConfig.resolution || "hd",
      fps: shotstackConfig.fps || 25,
      size: { width: 1080, height: 1920 },
    },
  };
}

async function submitRender(payload, apiKey, env) {
  const endpoint = ENDPOINTS[env];
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shotstack submit failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.response.id;
}

async function pollRender(renderId, apiKey, env, timeoutMs = 300000) {
  const endpoint = `${ENDPOINTS[env]}/${renderId}`;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    await sleep(5000);

    const res = await fetch(endpoint, {
      headers: { "x-api-key": apiKey },
    });

    if (!res.ok) throw new Error(`Shotstack poll failed (${res.status})`);

    const data = await res.json();
    const { status, url } = data.response;
    console.log(`  [Shotstack] ${renderId} → ${status}`);

    if (status === "done") return url;
    if (status === "failed") throw new Error(`Render failed: ${renderId}`);
  }

  throw new Error("Shotstack render timed out");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const cli = parseArgs();
  const env = cli.env || "sandbox";

  const apiKey =
    env === "production"
      ? process.env.SHOTSTACK_API_KEY_PRODUCTION
      : process.env.SHOTSTACK_API_KEY_SANDBOX;

  if (!apiKey) {
    console.error(`ERROR: SHOTSTACK_API_KEY_${env.toUpperCase()} not set in .env`);
    process.exit(1);
  }

  // Collect image URLs
  let imageUrls = [];

  if (cli.urls) {
    imageUrls = cli.urls.split(",").map((u) => u.trim()).filter(Boolean);
  } else if (cli["urls-file"]) {
    const content = fs.readFileSync(cli["urls-file"], "utf8");
    imageUrls = content.split("\n").map((u) => u.trim()).filter(Boolean);
  } else if (cli.config) {
    const config = JSON.parse(fs.readFileSync(cli.config, "utf8"));
    if (config.shotstack && config.shotstack.clips) {
      imageUrls = config.shotstack.clips.map((c) => c.url).filter(Boolean);
    }
  }

  if (imageUrls.length === 0) {
    console.error("ERROR: Aucune URL d'image fournie. Utilise --urls ou --urls-file ou --config.");
    process.exit(1);
  }

  // Build payload
  let payload;
  const preset = cli.preset || "obsidian";

  if (preset === "obsidian") {
    payload = buildObsidianPayload(imageUrls);
  } else if (cli.config) {
    const config = JSON.parse(fs.readFileSync(cli.config, "utf8"));
    payload = buildCustomPayload(config.shotstack || {}, imageUrls);
  } else {
    payload = buildObsidianPayload(imageUrls);
  }

  console.log(`\nClaude-PIPE — Shotstack Assembly`);
  console.log(`  Env: ${env}`);
  console.log(`  Images: ${imageUrls.length}`);
  console.log(`  Preset: ${preset}\n`);

  // Submit render
  const renderId = await submitRender(payload, apiKey, env);
  console.log(`  Render soumis: ${renderId}`);
  console.log(`  Polling jusqu'à la fin...\n`);

  // Poll
  const videoUrl = await pollRender(renderId, apiKey, env);
  console.log(`\n  Video prête: ${videoUrl}`);

  // Download
  const outputDir = cli.output || "output";
  fs.mkdirSync(outputDir, { recursive: true });
  const filename = `montage-${Date.now()}.mp4`;
  const dest = path.join(outputDir, filename);

  console.log(`  Téléchargement → ${dest}`);
  await downloadFile(videoUrl, dest);
  console.log(`  Saved: ${dest}`);

  // Save URL to file for reference
  const urlFile = path.join(outputDir, "last-render-url.txt");
  fs.writeFileSync(urlFile, videoUrl);
  console.log(`  URL sauvegardée: ${urlFile}`);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
