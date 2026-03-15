#!/usr/bin/env node
/**
 * Claude-PIPE — Lipsync sur moments clés avec LatentSync
 *
 * S'intercale entre animate-images.js et assemble-video.js.
 * Pour chaque scène marquée "lipsync: true" dans la config,
 * extrait le segment audio correspondant et synchronise les lèvres
 * via LatentSync (ByteDance) sur Replicate.
 *
 * Prérequis: ffmpeg installé (disponible sur les runners GitHub Actions)
 *
 * Usage:
 *   node lipsync-scenes.js --config configs/clip-01.json
 *   node lipsync-scenes.js --config configs/clip-01.json --dry-run
 *
 * Lit:   output/kling-meta.json
 * Écrit: output/lipsync-meta.json (merge avec kling-meta.json)
 */

require("dotenv").config();
const Replicate = require("replicate");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const { execSync, spawnSync } = require("child_process");

// ─── Modèles lipsync disponibles ──────────────────────────────────────────────

const LIPSYNC_MODELS = {
  // LatentSync (ByteDance) — état de l'art 2025, phonème par phonème
  "latentsync": "bytedance/latentsync",
  // Wav2Lip — plus ancien mais robuste
  "wav2lip": "devxpy/cog-wav2lip",
  // SadTalker — expressif, buste complet
  "sadtalker": "lucataco/sadtalker",
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

function hasFfmpeg() {
  const result = spawnSync("ffmpeg", ["-version"], { stdio: "pipe" });
  return result.status === 0;
}

/**
 * Extrait un segment audio avec ffmpeg
 * @param {string} audioFile - chemin vers le fichier audio source
 * @param {number} startSec  - début du segment en secondes
 * @param {number} duration  - durée du segment en secondes
 * @param {string} dest      - chemin de sortie (.mp3 ou .wav)
 */
function extractAudioSegment(audioFile, startSec, duration, dest) {
  const cmd = `ffmpeg -y -i "${audioFile}" -ss ${startSec} -t ${duration} -acodec copy "${dest}" 2>&1`;
  try {
    execSync(cmd, { stdio: "pipe" });
    return true;
  } catch (err) {
    // Si copy échoue (format incompatible), ré-encoder en mp3
    const cmd2 = `ffmpeg -y -i "${audioFile}" -ss ${startSec} -t ${duration} -ar 44100 -ab 192k "${dest}" 2>&1`;
    try {
      execSync(cmd2, { stdio: "pipe" });
      return true;
    } catch (err2) {
      console.error(`  WARN: Extraction audio échouée: ${err2.message}`);
      return false;
    }
  }
}

/**
 * Upload un fichier local vers Replicate pour obtenir une URL temporaire
 * Replicate accepte les fichiers en base64 data URI pour les inputs
 */
function fileToDataUri(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mimeMap = {
    mp4: "video/mp4", mov: "video/quicktime",
    mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4",
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  };
  const mime = mimeMap[ext] || "application/octet-stream";
  const data = fs.readFileSync(filePath);
  return `data:${mime};base64,${data.toString("base64")}`;
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
  const dryRun = !!cli["dry-run"];

  // ── Charger la config ──────────────────────────────────────────────────────
  if (!cli.config) {
    console.error("Usage: node lipsync-scenes.js --config configs/clip.json");
    process.exit(1);
  }
  if (!fs.existsSync(cli.config)) {
    console.error(`Config introuvable: ${cli.config}`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(cli.config, "utf8"));
  const outputDir = config.outputDir || "output";
  const lipsyncConfig = config.lipsync || {};

  if (!lipsyncConfig.enabled) {
    console.log("Lipsync désactivé dans la config (lipsync.enabled: false). Rien à faire.");
    process.exit(0);
  }

  const modelKey = lipsyncConfig.model || "latentsync";
  const modelId = LIPSYNC_MODELS[modelKey];
  if (!modelId) {
    console.error(`Modèle lipsync inconnu: ${modelKey}. Options: ${Object.keys(LIPSYNC_MODELS).join(", ")}`);
    process.exit(1);
  }

  // ── Fichier audio source ───────────────────────────────────────────────────
  const audioFile = lipsyncConfig.audioFile;
  if (!audioFile || !fs.existsSync(audioFile)) {
    console.error(`Fichier audio introuvable: ${audioFile}`);
    console.error("Renseigne lipsync.audioFile dans ta config.");
    process.exit(1);
  }

  // ── Charger les métadonnées Kling ──────────────────────────────────────────
  const metaFile = path.join(outputDir, "kling-meta.json");
  if (!fs.existsSync(metaFile)) {
    console.error(`${metaFile} introuvable. Lance d'abord animate-images.js.`);
    process.exit(1);
  }
  const klingMeta = JSON.parse(fs.readFileSync(metaFile, "utf8"));

  // ── Identifier les scènes lipsync ──────────────────────────────────────────
  // Dans config.requests, lipsync: true + audioStart + audioDuration (ou déduit du BPM)
  const requests = config.requests || [];
  const lipsyncScenes = requests
    .map((r, i) => ({ ...r, _index: i }))
    .filter((r) => r.lipsync === true);

  if (lipsyncScenes.length === 0) {
    console.log("Aucune scène marquée 'lipsync: true' dans la config. Rien à faire.");
    // Copier kling-meta.json tel quel comme lipsync-meta.json
    fs.copyFileSync(metaFile, path.join(outputDir, "lipsync-meta.json"));
    process.exit(0);
  }

  console.log(`\nClaude-PIPE — Lipsync (${modelKey})`);
  console.log(`  Modèle: ${modelId}`);
  console.log(`  Audio source: ${audioFile}`);
  console.log(`  Scènes à traiter: ${lipsyncScenes.length}/${requests.length}\n`);

  if (!hasFfmpeg()) {
    console.error("ERROR: ffmpeg est requis pour l'extraction audio. Installe-le ou utilise GitHub Actions.");
    process.exit(1);
  }

  // ── Copie travail du meta — on va modifier certaines entrées ──────────────
  const finalMeta = [...klingMeta];

  for (const scene of lipsyncScenes) {
    const idx = scene._index;
    const clipMeta = klingMeta[idx];

    if (!clipMeta) {
      console.warn(`  WARN: Scène ${idx} introuvable dans kling-meta.json — ignorée`);
      continue;
    }

    // Durée du clip = depuis la config shotstack ou la config kling
    const clipDuration = scene.audioDuration
      || lipsyncConfig.defaultClipDuration
      || config.shotstack?.clipDuration
      || config.kling?.duration
      || 5;

    // Position dans le morceau = somme des durées précédentes (approximation)
    // Ou override explicite via scene.audioStart
    const audioStart = scene.audioStart !== undefined
      ? scene.audioStart
      : idx * clipDuration;

    console.log(`[${idx + 1}/${requests.length}] Scène ${idx + 1} — lipsync`);
    console.log(`  Clip: ${clipMeta.url.slice(0, 70)}...`);
    console.log(`  Segment audio: ${audioStart}s → ${audioStart + clipDuration}s`);

    if (dryRun) {
      console.log(`  [DRY RUN] Rien généré.`);
      continue;
    }

    // ── Extraire le segment audio ────────────────────────────────────────────
    const audioSegmentPath = path.join(outputDir, `audio-segment-${idx + 1}.mp3`);
    const extracted = extractAudioSegment(audioFile, audioStart, clipDuration, audioSegmentPath);
    if (!extracted) {
      console.warn(`  WARN: Extraction audio échouée pour scène ${idx + 1} — lipsync ignoré`);
      continue;
    }
    console.log(`  Segment extrait: ${audioSegmentPath}`);

    // ── Préparer les inputs pour Replicate ──────────────────────────────────
    // LatentSync accepte video + audio en data URI ou URL publique
    const videoInput = clipMeta.url; // URL CDN Shotstack ou Replicate (doit être publique)
    const audioDataUri = fileToDataUri(audioSegmentPath);

    let lipsyncInput;
    if (modelKey === "latentsync") {
      lipsyncInput = {
        video: videoInput,
        audio: audioDataUri,
        // Options qualité
        inference_steps: lipsyncConfig.inferenceSteps || 25,
        guidance_scale: lipsyncConfig.guidanceScale || 1.5,
      };
    } else if (modelKey === "wav2lip") {
      lipsyncInput = {
        face: videoInput,
        audio: audioDataUri,
        pads: "0 10 0 0",
        fps: 25,
        out_height: 480,
        smooth: true,
      };
    } else if (modelKey === "sadtalker") {
      lipsyncInput = {
        source_image: videoInput, // SadTalker préfère une image fixe
        driven_audio: audioDataUri,
        preprocess: "full",
        still_mode: false,
        use_enhancer: true,
      };
    }

    // ── Délai entre requêtes (rate limit) ────────────────────────────────────
    if (lipsyncScenes.indexOf(scene) > 0) {
      console.log(`  Attente 10s (rate limit)...`);
      await new Promise((r) => setTimeout(r, 10000));
    }

    try {
      console.log(`  Appel Replicate (${modelId})...`);
      const output = await client.run(modelId, { input: lipsyncInput });
      const rawUrl = Array.isArray(output) ? output[0] : output;
      const lipsyncUrl = resolveUrl(rawUrl);

      console.log(`  Lipsync URL: ${lipsyncUrl}`);

      if (lipsyncUrl && lipsyncUrl.startsWith("http")) {
        // Télécharger en local
        const filename = `lipsync-scene-${idx + 1}-${Date.now()}.mp4`;
        const dest = path.join(outputDir, filename);
        await downloadFile(lipsyncUrl, dest);
        console.log(`  Saved: ${dest}`);

        // Mettre à jour le meta pour cette scène
        finalMeta[idx] = {
          ...clipMeta,
          url: lipsyncUrl,
          type: "video",
          lipsync: true,
          lipsyncModel: modelKey,
          originalUrl: clipMeta.url,
        };
      } else {
        console.warn(`  WARN: URL lipsync invalide — on garde la vidéo originale`);
      }
    } catch (err) {
      console.error(`  ERROR lipsync scène ${idx + 1}: ${err.message}`);
      console.error(`  On garde la vidéo Kling originale pour cette scène.`);
    }
  }

  // ── Sauvegarder le meta final ──────────────────────────────────────────────
  const lipsyncMetaPath = path.join(outputDir, "lipsync-meta.json");
  fs.writeFileSync(lipsyncMetaPath, JSON.stringify(finalMeta, null, 2));
  console.log(`\n  Meta lipsync sauvegardé: ${lipsyncMetaPath}`);
  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
