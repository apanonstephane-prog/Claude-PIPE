# Claude-PIPE — Universal Replicate Media Pipeline

A self-contained pipeline for generating images and videos via [Replicate](https://replicate.com), designed for use with Claude Code.

## Setup

```bash
cp .env.example .env
# Edit .env and add your REPLICATE_API_TOKEN
npm install
```

## Quick Start

### CLI — single prompt

```bash
# Generate an image
node generate-images.js --prompt "A futuristic city at night" --type image --style cinematic

# Generate a video
node generate-images.js --prompt "Drone over a forest" --type video --model ltx-video

# Custom output dir
node generate-images.js --prompt "Abstract logo" --style logo --output ./assets
```

### CLI — batch via config

```bash
cp media-config.example.json media-config.json
# Edit media-config.json with your prompts
node generate-images.js
# or: node generate-images.js --config custom-config.json
```

### HTTP API (Next.js)

```bash
npm run dev
# Server runs at http://localhost:3000
```

**GET /api/generate-media** — returns available models and styles.

**POST /api/generate-media**

```json
{
  "type": "image",
  "prompt": "A photorealistic portrait of a scientist",
  "model": "flux-schnell",
  "style": "photorealistic",
  "width": 1024,
  "height": 1024,
  "numOutputs": 1
}
```

```json
{
  "type": "video",
  "prompt": "Time-lapse of clouds over mountains",
  "model": "ltx-video",
  "style": "cinematic",
  "width": 1280,
  "height": 720,
  "duration": 5
}
```

### Browser UI

Visit `http://localhost:3000` after `npm run dev` to use the visual interface.

### TypeScript SDK

```ts
import { ReplicateMediaPipeline } from "./src/replicate-media";

const pipe = new ReplicateMediaPipeline(); // reads REPLICATE_API_TOKEN from env

const result = await pipe.generateImage({
  prompt: "A minimalist logo for a tech startup",
  style: "logo",
  model: "flux-dev",
});
console.log(result.urls);

const video = await pipe.generateVideo({
  prompt: "Ocean waves at sunset",
  model: "ltx-video",
  style: "cinematic",
  duration: 5,
});
```

## Models

| Type  | Key           | Replicate model                  | Notes            |
|-------|---------------|----------------------------------|------------------|
| Image | `flux-schnell`| `black-forest-labs/flux-schnell` | Default, fastest |
| Image | `flux-dev`    | `black-forest-labs/flux-dev`     | Higher quality   |
| Image | `sdxl`        | `stability-ai/sdxl`              | Classic SDXL     |
| Video | `ltx-video`   | `lightricks/ltx-video`           | Default video    |
| Video | `video-01`    | `minimax/video-01`               | Alternative      |

## Styles

| Style           | Description                              |
|-----------------|------------------------------------------|
| `cinematic`     | Film grain, dramatic lighting            |
| `photorealistic`| 8K, natural lighting, ultra-detailed     |
| `documentary`   | Candid, journalistic, raw                |
| `abstract`      | Geometric, bold colors, conceptual       |
| `poster`        | High contrast, graphic design            |
| `illustration`  | Digital art, vibrant, detailed (default) |
| `logo`          | Minimal, vector, brand identity          |

Style is **auto-detected** from `context.projectName`, `context.conversationTheme`, and `context.keywords` when not specified explicitly.

## GitHub Actions

```yaml
- name: Generate media assets
  env:
    REPLICATE_API_TOKEN: ${{ secrets.REPLICATE_API_TOKEN }}
  run: |
    npm ci
    node generate-images.js --config media-config.json
```

## Project Structure

```
Claude-PIPE/
├── src/
│   ├── replicate-media.ts      # Core pipeline (TypeScript)
│   ├── api/route.ts            # Next.js API route (POST/GET)
│   └── components/
│       └── MediaGenerator.tsx  # React browser UI
├── generate-images.js          # CLI / GitHub Actions script
├── media-config.example.json   # Batch config example
├── .env.example                # Environment variable template
├── package.json
├── tsconfig.json
└── CLAUDE.md                   # Instructions for Claude Code
```
