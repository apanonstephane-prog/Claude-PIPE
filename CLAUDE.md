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
| `src/api/route.ts` | Next.js HTTP endpoint `POST /api/generate-media` |
| `src/components/MediaGenerator.tsx` | React form UI for browser-based generation |
| `generate-images.js` | Node.js CLI script — works in GitHub Actions |
| `media-config.example.json` | Batch generation config template |

---

## Models available

**Images:** `flux-schnell` (default, fast), `flux-dev` (quality), `sdxl`, `nano-banana-pro` (Gemini 3 Pro — text rendering + 4K editing), `nano-banana-2` (Gemini 3.1 Flash — fast + 4K)

**Videos:** `ltx-video` (default), `video-01`, `kling-v2.1` (image-to-video 1080p), `kling-v2.1-pro` (high quality), `kling-3.0` (4K HDR, native audio)

## Styles

`cinematic` | `photorealistic` | `documentary` | `abstract` | `poster` | `illustration` | `logo`

Style is **auto-detected** from project/conversation context if not specified.

---

## Rules for Claude Code

- **This repo is self-contained.** Never mix pipeline code into other projects — always import from here.
- When generating media for a project, run `generate-images.js` from this repo, not from the project repo.
- Store outputs in `./output/` (git-ignored).
- The `REPLICATE_API_TOKEN` must always come from `.env` or GitHub Secrets — never hardcode it.
- Prefer `flux-schnell` for speed, `flux-dev` for quality, `nano-banana-2` for text-in-image or 4K. Use `ltx-video` for videos by default, `kling-3.0` for cinematic 4K HDR.
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
