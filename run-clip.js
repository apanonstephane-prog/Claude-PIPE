#!/usr/bin/env node
/**
 * Claude-PIPE — Orchestrateur clip musical
 *
 * Gère en un seul script :
 *   1. Kling text-to-video  (plans sans CREF)
 *   2. Kling image-to-video (plans avec crefImagePath — data URI local)
 *   3. LatentSync lipsync   (plans marqués lipsync: true)
 *   4. Sauvegarde metadata  output/<project>/clip-meta.json
 *
 * Usage:
 *   node run-clip.js --config configs/circus-lovni.json
 *   node run-clip.js --config configs/circus-lovni.json --dry-run
 *   node run-clip.js --config configs/circus-lovni.json --scene 5
 *   node run-clip.js --config configs/circus-lovni.json --only-lipsync
 */

require("dotenv").config();
const Replicate = require("replicate");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const { execSync, spawnSync } = require("child_process");

// ─── Modèles ──────────────────────────────────────────────────────────────────

const KLING_MODELS = {
  "kling-3.0":       "kwaivgi/kling-v3-video",
  "kling-v2.1":      "kwaivgi/kling-v2.1",
  "kling-v2.1-pro":  "kwaivgi/kling-v2.1-pro",
  "kling-3.0-omni":  "kwaivgi/kling-v3-video",
};

const LIPSYNC_MODELS = {
  "latentsync": "bytedance/latentsync",
  "wav2lip":    "devxpy/cog-wav2lip",
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

function fileToDataUri(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mimeMap = {
    mp4: "video/mp4", mov: "video/quicktime",
    mp3: "audio/mpeg", wav: "audio/wav",
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  };
  const mime = mimeMap[ext] || "application/octet-stream";
  const data = fs.readFileSync(filePath);
  return `data:${mime};base64,${data.toString("base64")}`;
}

function resolveUrl(raw) {
  if (typeof raw === "string") return raw;
  if (raw && typeof raw.url === "function") return raw.url().toString();
  if (raw && typeof raw.toString === "function") return raw.toString();
  return String(raw);
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
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

function extractAudioSegment(audioFile, startSec, duration, dest) {
  const cmd = `ffmpeg -y -i "${audioFile}" -ss ${startSec} -t ${duration} -ar 44100 -ab 192k "${dest}" 2>&1`;
  try {
    execSync(cmd, { stdio: "pipe" });
    return true;
  } catch (err) {
    console.error(`  WARN: Extraction audio échouée: ${err.message}`);
    return false;
  }
}

function hasFfmpeg() {
  return spawnSync("ffmpeg", ["-version"], { stdio: "pipe" }).status === 0;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadMeta(metaPath) {
  if (fs.existsSync(metaPath)) {
    return JSON.parse(fs.readFileSync(metaPath, "utf8"));
  }
  return {};
}

function saveMeta(metaPath, meta) {
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
}

// ─── Kling — génération vidéo ─────────────────────────────────────────────────

async function generateKlingVideo(client, scene, klingConfig, dryRun) {
  const modelKey = scene.model || klingConfig.model || "kling-3.0";
  const modelId  = KLING_MODELS[modelKey] || KLING_MODELS["kling-3.0"];
  const duration  = scene.duration || klingConfig.duration || 5;
  const mode      = klingConfig.mode || "pro";
  const aspect    = klingConfig.aspectRatio || "16:9";
  const negPrompt = klingConfig.negativePrompt || "blurry, shaky, low quality, watermark";

  console.log(`  Model: ${modelId} | ${duration}s | ${aspect}`);

  if (dryRun) {
    console.log(`  [DRY RUN] prompt: ${scene.prompt.slice(0, 80)}...`);
    return null;
  }

  let input;

  if (scene.crefImagePath) {
    // Image-to-video — CREF local → data URI
    const absPath = path.resolve(scene.crefImagePath);
    if (!fs.existsSync(absPath)) {
      console.warn(`  WARN: CREF introuvable: ${absPath} — bascule text-to-video`);
    } else {
      console.log(`  CREF: ${scene.crefImagePath}`);
      const imageDataUri = fileToDataUri(absPath);
      input = {
        prompt: scene.motionPrompt || scene.prompt,
        start_image: imageDataUri,
        duration,
        mode,
        aspect_ratio: aspect,
        negative_prompt: negPrompt,
        cfg_scale: 0.5,
      };
    }
  }

  if (!input) {
    // Text-to-video pur
    input = {
      prompt: scene.prompt,
      duration,
      mode,
      aspect_ratio: aspect,
      negative_prompt: negPrompt,
      cfg_scale: 0.5,
    };
  }

  const output = await client.run(modelId, { input });
  const raw = Array.isArray(output) ? output[0] : output;
  return resolveUrl(raw);
}

// ─── LatentSync — lipsync ─────────────────────────────────────────────────────

async function applyLipsync(client, videoUrl, audioFile, audioStart, audioDuration, lipsyncConfig, outputDir, sceneIdx, dryRun) {
  const modelKey = lipsyncConfig.model || "latentsync";
  const modelId  = LIPSYNC_MODELS[modelKey] || LIPSYNC_MODELS["latentsync"];

  if (!hasFfmpeg()) {
    console.warn(`  WARN: ffmpeg absent — lipsync ignoré pour scène ${sceneIdx}`);
    return videoUrl;
  }

  if (dryRun) {
    console.log(`  [DRY RUN] LatentSync: audio ${audioStart}s → ${audioStart + audioDuration}s`);
    return videoUrl;
  }

  // Extraire le segment audio
  const segPath = path.join(outputDir, `audio-seg-${sceneIdx}.mp3`);
  const ok = extractAudioSegment(audioFile, audioStart, audioDuration, segPath);
  if (!ok) {
    console.warn(`  WARN: segment audio échoué — lipsync ignoré`);
    return videoUrl;
  }

  console.log(`  LatentSync: segment ${audioStart}s → ${audioStart + audioDuration}s`);
  const audioDataUri = fileToDataUri(segPath);

  const output = await client.run(modelId, {
    input: {
      video: videoUrl,
      audio: audioDataUri,
      inference_steps: lipsyncConfig.inferenceSteps || 25,
      guidance_scale:  lipsyncConfig.guidanceScale  || 1.5,
    },
  });

  const raw = Array.isArray(output) ? output[0] : output;
  const lipsyncUrl = resolveUrl(raw);

  if (lipsyncUrl && lipsyncUrl.startsWith("http")) {
    const dest = path.join(outputDir, `lipsync-scene-${sceneIdx}-${Date.now()}.mp4`);
    await downloadFile(lipsyncUrl, dest);
    console.log(`  Lipsync saved: ${dest}`);
    return lipsyncUrl;
  }

  console.warn(`  WARN: URL lipsync invalide — vidéo originale conservée`);
  return videoUrl;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) { console.error("ERROR: REPLICATE_API_TOKEN manquant dans .env"); process.exit(1); }

  const client = new Replicate({ auth: token });
  const cli    = parseArgs();
  const dryRun = !!cli["dry-run"];
  const onlyLipsync  = !!cli["only-lipsync"];
  const sceneFilter  = cli.scene ? parseInt(cli.scene) : null;

  // ── Config ──────────────────────────────────────────────────────────────────
  if (!cli.config || !fs.existsSync(cli.config)) {
    console.error(`Usage: node run-clip.js --config configs/circus-lovni.json`);
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(cli.config, "utf8"));
  const outputDir = config.outputDir || "output";
  fs.mkdirSync(outputDir, { recursive: true });

  const klingConfig   = config.kling || {};
  const lipsyncConfig = config.lipsync || {};
  const audioFile     = lipsyncConfig.audioFile;
  const requests      = config.requests || [];
  const metaPath      = path.join(outputDir, "clip-meta.json");
  const meta          = loadMeta(metaPath);

  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║  Claude-PIPE — run-clip.js                           ║`);
  console.log(`╚══════════════════════════════════════════════════════╝`);
  console.log(`  Config  : ${cli.config}`);
  console.log(`  Output  : ${outputDir}`);
  console.log(`  Scenes  : ${requests.length}${sceneFilter ? ` (filtre: scène ${sceneFilter})` : ""}`);
  console.log(`  Dry run : ${dryRun}`);
  if (onlyLipsync) console.log(`  Mode    : lipsync uniquement`);
  console.log("");

  for (let i = 0; i < requests.length; i++) {
    const scene = requests[i];
    const sceneNum = scene._scene || (i + 1);

    // Filtre par numéro de scène
    if (sceneFilter && sceneNum !== sceneFilter) continue;

    console.log(`\n── Scène ${sceneNum}/${requests.length} ─────────────────────────────────`);
    console.log(`   Section  : ${scene._section || "?"}`);
    console.log(`   Type     : ${scene._type || "?"}`);
    console.log(`   Timecode : ${scene._timestamp || "?"}`);
    if (scene._lyrics) console.log(`   Lyrics   : "${scene._lyrics}"`);
    if (scene._note)   console.log(`   Note     : ${scene._note}`);

    const sceneKey = `scene_${sceneNum}`;

    // ── Étape 1 : Génération Kling ──────────────────────────────────────────
    if (!onlyLipsync) {
      if (meta[sceneKey]?.videoUrl) {
        console.log(`  [SKIP] Vidéo déjà générée: ${meta[sceneKey].videoUrl.slice(0, 70)}...`);
      } else {
        try {
          if (i > 0 && !dryRun) {
            console.log(`  Rate limit: attente 12s...`);
            await sleep(12000);
          }

          const videoUrl = await generateKlingVideo(client, scene, klingConfig, dryRun);

          if (videoUrl) {
            console.log(`  Video: ${videoUrl.slice(0, 80)}...`);
            const dest = path.join(outputDir, `scene-${sceneNum}-${Date.now()}.mp4`);
            if (!dryRun) {
              await downloadFile(videoUrl, dest);
              console.log(`  Saved: ${dest}`);
            }
            meta[sceneKey] = { sceneNum, section: scene._section, type: scene._type, videoUrl, localFile: dest, lipsync: false };
            saveMeta(metaPath, meta);
          }
        } catch (err) {
          console.error(`  ERROR Kling scène ${sceneNum}: ${err.message}`);
          meta[sceneKey] = { sceneNum, error: err.message };
          saveMeta(metaPath, meta);
          continue;
        }
      }
    }

    // ── Étape 2 : Lipsync ──────────────────────────────────────────────────
    if (scene.lipsync && audioFile) {
      const videoUrl = meta[sceneKey]?.videoUrl;
      if (!videoUrl) {
        console.warn(`  WARN: pas de vidéo pour lipsync scène ${sceneNum}`);
        continue;
      }
      if (meta[sceneKey]?.lipsync) {
        console.log(`  [SKIP] Lipsync déjà appliqué.`);
        continue;
      }

      console.log(`  Lipsync activé → LatentSync`);
      try {
        if (!dryRun) {
          console.log(`  Rate limit lipsync: attente 10s...`);
          await sleep(10000);
        }

        const audioStart    = scene.audioStart || 0;
        const audioDuration = scene.audioDuration || lipsyncConfig.defaultClipDuration || 5;

        const lipsyncUrl = await applyLipsync(
          client, videoUrl, audioFile, audioStart, audioDuration,
          lipsyncConfig, outputDir, sceneNum, dryRun
        );

        meta[sceneKey].lipsyncUrl  = lipsyncUrl;
        meta[sceneKey].lipsync     = true;
        meta[sceneKey].finalUrl    = lipsyncUrl;
        saveMeta(metaPath, meta);
      } catch (err) {
        console.error(`  ERROR LatentSync scène ${sceneNum}: ${err.message}`);
      }
    } else if (!meta[sceneKey]?.finalUrl && meta[sceneKey]?.videoUrl) {
      meta[sceneKey].finalUrl = meta[sceneKey].videoUrl;
      saveMeta(metaPath, meta);
    }
  }

  // ── Résumé ──────────────────────────────────────────────────────────────────
  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║  RÉSUMÉ                                              ║`);
  console.log(`╚══════════════════════════════════════════════════════╝`);
  const done    = Object.values(meta).filter((s) => s.videoUrl).length;
  const lipDone = Object.values(meta).filter((s) => s.lipsync).length;
  const errors  = Object.values(meta).filter((s) => s.error).length;
  console.log(`  Vidéos générées : ${done}/${requests.length}`);
  console.log(`  Lipsync appliqué: ${lipDone}`);
  console.log(`  Erreurs         : ${errors}`);
  console.log(`  Metadata        : ${metaPath}`);

  if (done === requests.length) {
    console.log(`\n  Toutes les scènes sont prêtes.`);
    console.log(`  Prochaine étape : node assemble-video.js --config ${cli.config}`);
  } else {
    console.log(`\n  Relance la commande pour reprendre où tu t'es arrêté.`);
    console.log(`  Les scènes déjà générées sont skippées automatiquement.`);
  }
  console.log("");
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
