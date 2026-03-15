#!/usr/bin/env node
/**
 * Claude-PIPE — Shotstack video assembly CLI
 * Assemble clips vidéo Kling + son + sous-titres → MP4 final 9:16
 *
 * Usage:
 *   node assemble-video.js --config configs/pub-obsidian.json
 *   node assemble-video.js --config configs/pub-obsidian.json --env production
 *   node assemble-video.js --urls "url1,url2,url3,url4" --preset obsidian
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

// ─── Shotstack endpoints ───────────────────────────────────────────────────────

const ENDPOINTS = {
  sandbox: "https://api.shotstack.io/stage/render",
  production: "https://api.shotstack.io/v1/render",
};

// ─── Payload builder ───────────────────────────────────────────────────────────

function buildPayload(mediaUrls, shotstackConfig, mediaType = "image") {
  const clipDuration = shotstackConfig.clipDuration || 3.75;
  // Pas de fondu enchaîné par défaut — coupes sèches
  const kenBurnsEffects = ["zoomIn", "zoomOut", "slideLeft", "slideRight"];

  let currentStart = 0;

  // ── Track 1 : clips média (vidéo ou image) ─────────────────────────────────
  const mediaClips = mediaUrls.map((url, i) => {
    const start = currentStart;
    currentStart += clipDuration;

    // Déterminer le type réel depuis les métadonnées ou heuristiques
    const meta = shotstackConfig._mediaMeta;
    const isVideo = meta
      ? meta[i]?.type === "video"
      : mediaType === "video" || url.includes(".mp4");

    const clip = {
      asset: isVideo
        ? { type: "video", src: url }
        : { type: "image", src: url },
      start,
      length: clipDuration,
    };

    if (!isVideo) {
      clip.fit = "cover";
      clip.effect = kenBurnsEffects[i % kenBurnsEffects.length];
    }

    return clip;
  });

  const totalDuration = currentStart;

  // ── Track 2 : overlays texte synchronisés ─────────────────────────────────
  const textClips = (shotstackConfig.textOverlays || []).map((overlay) => ({
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
  }));

  const tracks = [{ clips: mediaClips }];
  if (textClips.length > 0) {
    tracks.push({ clips: textClips });
  }

  // ── Timeline ───────────────────────────────────────────────────────────────
  const timeline = {
    background: "#000000",
    tracks,
  };

  if (shotstackConfig.soundtrack) {
    timeline.soundtrack = {
      src: shotstackConfig.soundtrack,
      effect: "fadeInFadeOut",
      volume: shotstackConfig.soundtrackVolume || 0.55,
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

// ─── Shotstack API calls ────────────────────────────────────────────────────────

async function submitRender(payload, apiKey, env) {
  const res = await fetch(ENDPOINTS[env], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await res.text();
  if (!res.ok) {
    throw new Error(`Shotstack submit failed (${res.status}): ${responseText}`);
  }

  const data = JSON.parse(responseText);
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
    if (status === "failed") {
      throw new Error(`Render échoué: ${renderId}`);
    }
  }

  throw new Error("Shotstack render timed out (5min)");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const cli = parseArgs();

  // Charger la config
  let config = {};
  if (cli.config && fs.existsSync(cli.config)) {
    config = JSON.parse(fs.readFileSync(cli.config, "utf8"));
  }

  const shotstackConfig = config.shotstack || {};
  const env = cli.env || shotstackConfig.env || "sandbox";
  const outputDir = config.outputDir || cli.output || "output";

  const apiKey =
    env === "production"
      ? process.env.SHOTSTACK_API_KEY_PRODUCTION
      : process.env.SHOTSTACK_API_KEY_SANDBOX;

  if (!apiKey) {
    console.error(`ERROR: SHOTSTACK_API_KEY_${env.toUpperCase()} non défini.`);
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  // ── Récupérer les URLs média ───────────────────────────────────────────────
  let mediaUrls = [];
  let mediaType = "image";

  if (cli.urls) {
    mediaUrls = cli.urls.split(",").map((u) => u.trim()).filter(Boolean);
  } else {
    // Préférer les clips Kling (vidéo) aux images statiques
    const klingFile = path.join(outputDir, "kling-urls.txt");
    const replicateFile = path.join(outputDir, "replicate-urls.txt");

    // Priorité : lipsync-meta.json > kling-meta.json (lipsync remplace certains clips)
    const lipsyncMetaFile = path.join(outputDir, "lipsync-meta.json");
    const metaFile = fs.existsSync(lipsyncMetaFile)
      ? lipsyncMetaFile
      : path.join(outputDir, "kling-meta.json");

    if (fs.existsSync(metaFile)) {
      // Utiliser les métadonnées type réel par URL
      const meta = JSON.parse(fs.readFileSync(metaFile, "utf8"));
      mediaUrls = meta.map((m) => m.url);
      // mediaType sera déterminé par URL dans buildPayload
      mediaType = "mixed";
      const lipsyncCount = meta.filter(m => m.lipsync).length;
      const sourceLabel = fs.existsSync(lipsyncMetaFile) ? "lipsync-meta" : "kling-meta";
      console.log(`  Source: ${sourceLabel} (${meta.filter(m=>m.type==="video").length} vidéos, ${meta.filter(m=>m.type==="image").length} images${lipsyncCount > 0 ? `, ${lipsyncCount} lipsync` : ""})`);
      // Passer la meta complète à buildPayload
      shotstackConfig._mediaMeta = meta;
    } else if (fs.existsSync(klingFile)) {
      mediaUrls = fs.readFileSync(klingFile, "utf8").split("\n").map((u) => u.trim()).filter(Boolean);
      mediaType = "video";
      console.log(`  Source: clips Kling animés (${mediaUrls.length} clips)`);
    } else if (fs.existsSync(replicateFile)) {
      mediaUrls = fs.readFileSync(replicateFile, "utf8").split("\n").map((u) => u.trim()).filter(Boolean);
      mediaType = "image";
      console.log(`  Source: images statiques Replicate (${mediaUrls.length} images)`);
    } else {
      console.error("ERROR: Aucun fichier kling-urls.txt ou replicate-urls.txt trouvé.");
      process.exit(1);
    }
  }

  if (mediaUrls.length === 0) {
    console.error("ERROR: Aucune URL média trouvée.");
    process.exit(1);
  }

  console.log(`\nClaude-PIPE — Shotstack Assembly`);
  console.log(`  Env: ${env}`);
  console.log(`  Clips: ${mediaUrls.length} (${mediaType})`);
  console.log(`  Format: 1080x1920 (9:16) @ ${shotstackConfig.fps || 25}fps`);
  console.log(`  Soundtrack: ${shotstackConfig.soundtrack ? "oui" : "non"}`);
  console.log(`  Text overlays: ${(shotstackConfig.textOverlays || []).length}\n`);

  // ── Build payload ──────────────────────────────────────────────────────────
  const payload = buildPayload(mediaUrls, shotstackConfig, mediaType);

  // ── Debug payload complet ─────────────────────────────────────────────────
  const totalClips = payload.timeline.tracks.reduce((acc, t) => acc + t.clips.length, 0);
  console.log(`  Payload: ${payload.timeline.tracks.length} tracks, ${totalClips} clips total`);
  console.log("  Payload JSON (debug):");
  console.log(JSON.stringify(payload, null, 2));

  // ── Soumettre le render ────────────────────────────────────────────────────
  const renderId = await submitRender(payload, apiKey, env);
  console.log(`  Render soumis: ${renderId}`);
  console.log(`  Polling toutes les 5s...\n`);

  // ── Attendre le résultat ───────────────────────────────────────────────────
  const videoUrl = await pollRender(renderId, apiKey, env);
  console.log(`\n  ✓ Vidéo prête: ${videoUrl}`);

  // ── Télécharger le MP4 ────────────────────────────────────────────────────
  const filename = `pub-obsidian-${Date.now()}.mp4`;
  const dest = path.join(outputDir, filename);
  console.log(`  Téléchargement → ${dest}`);
  await downloadFile(videoUrl, dest);
  console.log(`  ✓ Saved: ${dest}`);

  // Sauvegarder l'URL du render final
  fs.writeFileSync(path.join(outputDir, "final-video-url.txt"), videoUrl);
  console.log(`  ✓ URL finale: ${path.join(outputDir, "final-video-url.txt")}`);

  console.log("\nDone. Vidéo finale prête.");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
