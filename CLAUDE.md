# CLAUDE.md — Instructions for Claude Code

This repository is **Claude-PIPE**, a standalone media generation pipeline owned and used by Claude Code.
Use it to generate images and videos via Replicate in any conversation or project.

---

## How to use this pipeline

### 1. Setup (first time only)

```bash
cp .env.example .env
# Set REPLICATE_API_TOKEN in .env
npm install
```

### 2. Generate from any conversation

When a user asks Claude to generate an image or video, use this pipeline:

```bash
# Image — quick
node generate-images.js --prompt "<prompt>" --type image --style <style>

# Video
node generate-images.js --prompt "<prompt>" --type video --model ltx-video

# Batch from config
node generate-images.js --config media-config.json
```

### 3. Use the TypeScript API in code

```ts
import { getPipeline } from "./src/replicate-media";

const result = await getPipeline().generateImage({
  prompt: "...",
  style: "cinematic",
  context: { projectName: "my-project", conversationTheme: "sci-fi" },
});
// result.urls contains the generated image URLs
```

### 4. Start the web server (browser UI + HTTP API)

```bash
npm run dev
# UI at http://localhost:3000
# API at http://localhost:3000/api/generate-media
```

---

## Key files

| File | Purpose |
|------|---------|
| `src/replicate-media.ts` | Core pipeline — `generateImage()`, `generateVideo()`, `detectStyle()` |
| `src/master-prompt.ts` | Constructeur de prompts cinéma — `buildNanaBananaPrompt()`, `buildKling3Prompt()`, `DP_PRESETS` |
| `prompts/MASTER-PROMPT.md` | Référence complète : structure 7 couches, géométrie sacrée, color science, Kling O3/V3 |
| `src/api/route.ts` | Next.js HTTP endpoint `POST /api/generate-media` |
| `src/components/MediaGenerator.tsx` | React form UI for browser-based generation |
| `generate-images.js` | Node.js CLI script — works in GitHub Actions |
| `media-config.example.json` | Batch generation config template |

---

## Models available

**Images:** `flux-schnell` (default, fast), `flux-dev` (quality), `sdxl`, `nano-banana-pro` (Gemini 3 Pro — texte + 4K + 14 CREF), `nano-banana-2` (Gemini 3.1 Flash — rapide + 4K)

**Videos:**
- `ltx-video` (default, rapide)
- `video-01` (MiniMax)
- `kling-v2.1` / `kling-v2.1-pro` (image-to-video 1080p)
- `kling-3.0` **V3** — cinéma prompt-driven, 4K HDR, **multi-shot 15s**
- `kling-3.0-omni` **O3** — audio natif, Elements system (personnages persistants), **jusqu'à 30s**

## Styles

`cinematic` | `photorealistic` | `documentary` | `abstract` | `poster` | `illustration` | `logo`

Style is **auto-detected** from project/conversation context if not specified.

---

## Démarrage de chaque projet

**Toujours lire et remplir `QUESTIONNAIRE.md` avant toute génération.**
Les réponses déterminent : modèles, format, durée, rythme de montage, CREF, BPM.

---

## Rules for Claude Code

- **This repo is self-contained.** Never mix pipeline code into other projects — always import from here.
- When generating media for a project, run `generate-images.js` from this repo, not from the project repo.
- Store outputs in `./output/` (git-ignored).
- The `REPLICATE_API_TOKEN` must always come from `.env` or GitHub Secrets — never hardcode it.
- Prefer `flux-schnell` for speed, `flux-dev` for quality, `nano-banana-pro` for complex/layered instructions or text-in-image. Use `ltx-video` for quick video, `kling-3.0` (V3) for cinematic 4K HDR multi-shot, `kling-3.0-omni` (O3) when a specific character needs to persist across shots.
- **Always use `buildNanaBananaPrompt()` or `buildKling3Prompt()` from `src/master-prompt.ts`** for cinematic work — never raw string concatenation.
- **Read `prompts/MASTER-PROMPT.md`** before any cinematic generation to understand the 7-layer structure, composition grids, DP presets, and anti-patterns.
- When the user asks for images/videos related to a project, pass `context.projectName` and `context.keywords` to enable automatic style detection.

---

## Example: generating assets for a project

```ts
import { getPipeline } from "/path/to/Claude-PIPE/src/replicate-media";

const images = await getPipeline().batch(
  [
    { prompt: "Hero banner", context: { projectName: "startup-landing", keywords: ["tech", "modern"] } },
    { prompt: "Team photo illustration", style: "illustration" },
  ],
  "image"
);
```

```bash
# Or from CLI
node /path/to/Claude-PIPE/generate-images.js \
  --prompt "Hero banner for a tech startup" \
  --style poster \
  --output /path/to/project/public/images
```
