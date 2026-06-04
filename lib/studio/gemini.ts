/**
 * Gemini helpers for the internal /studio editor.
 *
 *  - restyleImage(): image-to-image (Gemini 2.5 Flash Image).
 *    Same model the public /preview tool uses, called directly with
 *    a user-supplied prompt instead of the hard-coded grill prompt.
 *
 *  - Veo image-to-video flow: split into kickoff + poll + download
 *    because video generation is a long-running operation (30–90s)
 *    that exceeds the default serverless maxDuration.
 *
 * If GEMINI_API_KEY is unset, every call returns null/throws a clear
 * error — preserving the rest of the app's "fail soft" pattern.
 */

const RESTYLE_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-image";
const VEO_MODEL = process.env.GEMINI_VEO_MODEL ?? "veo-3.1-fast-generate-preview";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function requireKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  return key;
}

export type RestyleResult = {
  mimeType: string;
  base64: string;
};

export async function restyleImage(args: {
  imageBase64: string;
  imageMimeType: string;
  prompt: string;
}): Promise<RestyleResult | null> {
  const apiKey = requireKey();
  const body = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: args.imageMimeType,
              data: args.imageBase64,
            },
          },
          { text: args.prompt },
        ],
      },
    ],
    generationConfig: { responseModalities: ["IMAGE"] },
  };

  const res = await fetch(
    `${API_BASE}/models/${RESTYLE_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(
      `[studio/restyle] failed status=${res.status} body=${text.slice(0, 600)}`
    );
    return null;
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inline_data?: { mime_type: string; data: string };
          inlineData?: { mimeType: string; data: string };
        }>;
      };
    }>;
  };

  const parts = json.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const inline = p.inline_data ?? p.inlineData;
    if (!inline) continue;
    const mimeType =
      "mime_type" in inline
        ? inline.mime_type
        : (inline as { mimeType: string }).mimeType;
    if (mimeType?.startsWith("image/")) {
      return { mimeType, base64: inline.data };
    }
  }
  return null;
}

export type VeoOperation = {
  /** Full operation name returned by the API, used for polling. */
  name: string;
};

export type VeoPollResult =
  | { done: false }
  | { done: true; videoUri: string }
  | { done: true; error: string };

/**
 * Kick off Veo image-to-video. Returns the operation name to poll.
 */
export async function startVeoAnimation(args: {
  imageBase64: string;
  imageMimeType: string;
  prompt: string;
}): Promise<VeoOperation> {
  const apiKey = requireKey();
  const body = {
    instances: [
      {
        prompt: args.prompt,
        image: {
          bytesBase64Encoded: args.imageBase64,
          mimeType: args.imageMimeType,
        },
      },
    ],
  };

  const res = await fetch(
    `${API_BASE}/models/${VEO_MODEL}:predictLongRunning?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Veo kickoff failed (${res.status}): ${text.slice(0, 400)}`
    );
  }

  const json = (await res.json()) as { name?: string };
  if (!json.name) throw new Error("Veo response missing operation name");
  return { name: json.name };
}

export async function pollVeoOperation(
  operationName: string
): Promise<VeoPollResult> {
  const apiKey = requireKey();
  const res = await fetch(
    `${API_BASE}/${operationName}?key=${apiKey}`,
    { method: "GET" }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      done: true,
      error: `Poll failed (${res.status}): ${text.slice(0, 300)}`,
    };
  }
  const json = (await res.json()) as {
    done?: boolean;
    error?: { message?: string };
    response?: {
      generateVideoResponse?: {
        generatedSamples?: Array<{ video?: { uri?: string } }>;
      };
    };
  };
  if (!json.done) return { done: false };
  if (json.error) {
    return { done: true, error: json.error.message ?? "Veo returned an error" };
  }
  const uri =
    json.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
  if (!uri) return { done: true, error: "Veo finished without a video URI" };
  return { done: true, videoUri: uri };
}

/**
 * Download a Veo-generated video. The URI is gated by the same API key.
 */
export async function downloadVeoVideo(uri: string): Promise<Buffer> {
  const apiKey = requireKey();
  const url = uri.includes("?") ? `${uri}&key=${apiKey}` : `${uri}?key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Video download failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf);
}
