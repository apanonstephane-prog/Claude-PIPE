"use client";

import { useState } from "react";
import type { MediaResult, VisualStyle, ImageModel, VideoModel } from "../replicate-media";

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaType = "image" | "video";

interface FormState {
  type: MediaType;
  prompt: string;
  model: ImageModel | VideoModel;
  style: VisualStyle | "auto";
  width: number;
  height: number;
  numOutputs: number;
  duration: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const IMAGE_MODELS: ImageModel[] = ["flux-schnell", "flux-dev", "sdxl"];
const VIDEO_MODELS: VideoModel[] = ["ltx-video", "video-01"];
const STYLES: (VisualStyle | "auto")[] = [
  "auto",
  "cinematic",
  "photorealistic",
  "documentary",
  "abstract",
  "poster",
  "illustration",
  "logo",
];

const DEFAULT_FORM: FormState = {
  type: "image",
  prompt: "",
  model: "flux-schnell",
  style: "auto",
  width: 1024,
  height: 1024,
  numOutputs: 1,
  duration: 5,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MediaGenerator() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<MediaResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "type") {
      setForm((prev) => ({
        ...prev,
        [key]: value,
        model: value === "image" ? "flux-schnell" : "ltx-video",
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body: Record<string, unknown> = {
        type: form.type,
        prompt: form.prompt,
        model: form.model,
        style: form.style === "auto" ? undefined : form.style,
        width: form.width,
        height: form.height,
      };
      if (form.type === "image") body.numOutputs = form.numOutputs;
      if (form.type === "video") body.duration = form.duration;

      const res = await fetch("/api/generate-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setResult(data as MediaResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const models = form.type === "image" ? IMAGE_MODELS : VIDEO_MODELS;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", fontFamily: "sans-serif", padding: "2rem" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>
        Claude-PIPE — Media Generator
      </h1>

      <form onSubmit={handleSubmit}>
        {/* Type */}
        <fieldset style={{ border: "none", padding: 0, marginBottom: "1rem" }}>
          <legend style={{ fontWeight: "bold", marginBottom: ".5rem" }}>Type</legend>
          {(["image", "video"] as MediaType[]).map((t) => (
            <label key={t} style={{ marginRight: "1.5rem" }}>
              <input
                type="radio"
                name="type"
                value={t}
                checked={form.type === t}
                onChange={() => update("type", t)}
              />{" "}
              {t}
            </label>
          ))}
        </fieldset>

        {/* Prompt */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: ".25rem" }}>
            Prompt
          </label>
          <textarea
            required
            rows={3}
            style={{ width: "100%", padding: ".5rem", boxSizing: "border-box" }}
            value={form.prompt}
            onChange={(e) => update("prompt", e.target.value)}
            placeholder="Describe the image or video you want to generate…"
          />
        </div>

        {/* Model + Style */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: ".25rem" }}>
              Model
            </label>
            <select
              style={{ width: "100%", padding: ".5rem" }}
              value={form.model}
              onChange={(e) => update("model", e.target.value as ImageModel | VideoModel)}
            >
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: ".25rem" }}>
              Style
            </label>
            <select
              style={{ width: "100%", padding: ".5rem" }}
              value={form.style}
              onChange={(e) => update("style", e.target.value as VisualStyle | "auto")}
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dimensions */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: ".25rem" }}>
              Width
            </label>
            <input
              type="number"
              style={{ width: "100%", padding: ".5rem", boxSizing: "border-box" }}
              value={form.width}
              onChange={(e) => update("width", Number(e.target.value))}
              min={256}
              max={2048}
              step={64}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: ".25rem" }}>
              Height
            </label>
            <input
              type="number"
              style={{ width: "100%", padding: ".5rem", boxSizing: "border-box" }}
              value={form.height}
              onChange={(e) => update("height", Number(e.target.value))}
              min={256}
              max={2048}
              step={64}
            />
          </div>

          {form.type === "image" && (
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: ".25rem" }}>
                Outputs
              </label>
              <input
                type="number"
                style={{ width: "100%", padding: ".5rem", boxSizing: "border-box" }}
                value={form.numOutputs}
                onChange={(e) => update("numOutputs", Number(e.target.value))}
                min={1}
                max={4}
              />
            </div>
          )}

          {form.type === "video" && (
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: ".25rem" }}>
                Duration (s)
              </label>
              <input
                type="number"
                style={{ width: "100%", padding: ".5rem", boxSizing: "border-box" }}
                value={form.duration}
                onChange={(e) => update("duration", Number(e.target.value))}
                min={1}
                max={30}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: ".75rem 2rem",
            background: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
          }}
        >
          {loading ? "Generating…" : `Generate ${form.type}`}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div style={{ marginTop: "1.5rem", color: "#c00", background: "#fee", padding: "1rem", borderRadius: 4 }}>
          Error: {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Result</h2>
          <p style={{ fontSize: ".85rem", color: "#555", marginBottom: "1rem" }}>
            Model: <code>{result.model}</code> &nbsp;|&nbsp; Style: <code>{result.style}</code>
            &nbsp;|&nbsp; {new Date(result.generatedAt).toLocaleString()}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            {result.urls.map((url, i) =>
              result.type === "image" ? (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Generated ${i + 1}`}
                    style={{ maxWidth: 400, maxHeight: 400, borderRadius: 4, display: "block" }}
                  />
                </a>
              ) : (
                <video
                  key={i}
                  src={url}
                  controls
                  style={{ maxWidth: 560, borderRadius: 4 }}
                />
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
