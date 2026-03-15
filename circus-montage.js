#!/usr/bin/env node
/**
 * circus-montage.js
 * Assemblage Shotstack — CIRCUS L'Ovni — Montage partiel (scènes 1-20)
 *
 * Usage:
 *   node circus-montage.js --dry-run   # Génère le payload JSON sans soumettre
 *   node circus-montage.js             # Soumet à Shotstack sandbox et poll
 */

"use strict";

const fs   = require("fs");
const path = require("path");
require("dotenv").config();

// ─── Config ───────────────────────────────────────────────────────────────────

const SHOTSTACK_KEY      = process.env.SHOTSTACK_API_KEY_SANDBOX;
const SHOTSTACK_ENDPOINT = "https://api.shotstack.io/stage/render";

// Audio hébergé sur GitHub (tracké dans le repo)
const AUDIO_URL =
  "https://raw.githubusercontent.com/apanonstephane-prog/Claude-PIPE/" +
  "claude/replicate-media-pipeline-pFAFZ/" +
  "audio/Circus-L_Ovni%20-%20Master.wav";

// Timecodes exacts depuis configs/circus-lovni.json (_timestamp + _cut_duration)
// start = secondes depuis le début | length = durée du cut en secondes
const SCENE_TIMECODES = {
  1:  { start: 0,   length: 6   }, // intro      0:00→0:06
  2:  { start: 6,   length: 5   }, // intro      0:06→0:11
  3:  { start: 11,  length: 5   }, // refrain1   0:11→0:16
  4:  { start: 16,  length: 5   }, // refrain1   0:16→0:21
  5:  { start: 21,  length: 5   }, // refrain1   0:21→0:26
  6:  { start: 26,  length: 5   }, // refrain1   0:26→0:31
  // gap 1s (0:31→0:32) → noir
  7:  { start: 32,  length: 3   }, // couplet1   0:32→0:35
  8:  { start: 35,  length: 2   }, // couplet1   0:35→0:37
  9:  { start: 37,  length: 3   }, // couplet1   0:37→0:40
  10: { start: 40,  length: 3   }, // couplet1   0:40→0:43
  11: { start: 43,  length: 2   }, // couplet1   0:43→0:45
  12: { start: 45,  length: 3   }, // couplet1   0:45→0:48
  13: { start: 48,  length: 2   }, // couplet1   0:48→0:50
  14: { start: 50,  length: 3   }, // couplet1   0:50→0:53
  15: { start: 53,  length: 1   }, // couplet1   0:53→0:54 (split avec 16)
  16: { start: 54,  length: 1   }, // couplet1   0:54→0:55
  17: { start: 55,  length: 4   }, // break      0:55→0:59
  18: { start: 59,  length: 2   }, // refrain2   0:59→1:01
  19: { start: 61,  length: 2   }, // refrain2   1:01→1:03
  20: { start: 63,  length: 2   }, // refrain2   1:03→1:05
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (!dryRun && !SHOTSTACK_KEY) {
    console.error("ERREUR: SHOTSTACK_API_KEY_SANDBOX requis dans .env");
    process.exit(1);
  }

  // Charger clip-meta.json
  // Cherche d'abord dans output/ (run local), sinon dans projects/ (repo)
  const metaPath =
    fs.existsSync(path.join(__dirname, "output/circus-lovni/clip-meta.json"))
      ? path.join(__dirname, "output/circus-lovni/clip-meta.json")
      : path.join(__dirname, "projects/circus-lovni/clip-meta.json");
  if (!fs.existsSync(metaPath)) {
    console.error("ERREUR: clip-meta.json introuvable à", metaPath);
    process.exit(1);
  }
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  console.log("✓ clip-meta.json chargé —", Object.keys(meta).length, "scènes");

  // Builder les clips
  const clips = [];
  for (let n = 1; n <= 20; n++) {
    const key   = `scene_${n}`;
    const tc    = SCENE_TIMECODES[n];
    const scene = meta[key];

    if (!scene || (!scene.finalUrl && !scene.videoUrl)) {
      console.warn(`  WARN: scène ${n} absente ou sans URL — ignorée`);
      continue;
    }

    const src = scene.finalUrl || scene.videoUrl;

    const clip = {
      asset: {
        type:   "video",
        src,
        volume: 0,  // mute le son Kling, seul le son CIRCUS reste
      },
      start:  tc.start,
      length: tc.length,
    };

    // Fade out sur la dernière scène
    if (n === 20) {
      clip.transition = { out: "fade" };
    }

    clips.push(clip);
    console.log(`  Scène ${String(n).padStart(2)} | ${tc.start}s → ${tc.start + tc.length}s | ${scene.section}/${scene.type}`);
  }

  console.log(`\n${clips.length} clips prêts — durée couverte: 0s → 65s (1:05)`);

  // Payload Shotstack
  const payload = {
    timeline: {
      background: "#000000",
      soundtrack: {
        src:    AUDIO_URL,
        effect: "fadeOut",
        volume: 1.0,
      },
      tracks: [{ clips }],
    },
    output: {
      format:     "mp4",
      resolution: "hd",
      fps:        25,
      size: {
        width:  1920,
        height: 1080,
      },
    },
  };

  // Sauvegarder le payload
  const payloadPath = path.join(__dirname, "output/circus-lovni/shotstack-payload.json");
  fs.mkdirSync(path.dirname(payloadPath), { recursive: true });
  fs.writeFileSync(payloadPath, JSON.stringify(payload, null, 2));
  console.log(`\nPayload sauvegardé: ${payloadPath}`);

  if (dryRun) {
    console.log("\n[DRY RUN] Payload prêt. Pas de soumission Shotstack.");
    return;
  }

  // Soumettre
  console.log("\nSoumission à Shotstack sandbox...");
  const res = await fetch(SHOTSTACK_ENDPOINT, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key":    SHOTSTACK_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Shotstack erreur (${res.status}):`, text);
    process.exit(1);
  }

  const data     = await res.json();
  const renderId = data.response.id;
  console.log(`\n✓ Render soumis — ID: ${renderId}`);
  console.log("Polling statut (toutes les 8s)...\n");

  // Poll
  while (true) {
    await new Promise((r) => setTimeout(r, 8000));

    const statusRes  = await fetch(`${SHOTSTACK_ENDPOINT}/${renderId}`, {
      headers: { "x-api-key": SHOTSTACK_KEY },
    });
    const statusData = await statusRes.json();
    const { status, url } = statusData.response;

    console.log(`  [${new Date().toISOString()}] Status: ${status}`);

    if (status === "done") {
      console.log(`\n✓ MONTAGE PRÊT !\nURL: ${url}`);
      fs.writeFileSync(
        path.join(__dirname, "output/circus-lovni/montage-result.json"),
        JSON.stringify({ renderId, url, status, timestamp: new Date().toISOString() }, null, 2)
      );
      break;
    }

    if (status === "failed") {
      console.error("\nRender échoué.");
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
