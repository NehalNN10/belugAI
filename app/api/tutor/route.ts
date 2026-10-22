import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, type Part } from "@google/genai";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

export const maxDuration = 30;

const MAX_HISTORY = 20;
const MAX_IMAGE_BASE64_CHARS = 3_000_000; // ~2.2 MB binary; client downscales far below this
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_IMAGE_PROMPT = "Help me with the problem in this image.";

type Turn = { role: "user" | "model"; text: string };
type Image = { base64: string; mimeType: string };

function parseHistory(raw: unknown): Turn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (h): h is Turn =>
        (h?.role === "user" || h?.role === "model") &&
        typeof h?.text === "string" &&
        h.text.trim() !== "",
    )
    .slice(-MAX_HISTORY);
}

function parseImage(raw: unknown): Image | null | "invalid" {
  if (raw === undefined || raw === null) return null;
  const { base64, mimeType } = raw as Partial<Image>;
  if (
    typeof base64 !== "string" ||
    base64.length === 0 ||
    base64.length > MAX_IMAGE_BASE64_CHARS ||
    typeof mimeType !== "string" ||
    !ALLOWED_IMAGE_TYPES.includes(mimeType)
  ) {
    return "invalid";
  }
  return { base64, mimeType };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server is missing GEMINI_API_KEY." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    message: rawMessage,
    history: rawHistory,
    image: rawImage,
  } = (body ?? {}) as { message?: unknown; history?: unknown; image?: unknown };

  const image = parseImage(rawImage);
  if (image === "invalid") {
    return NextResponse.json({ error: "Unsupported or oversized image." }, { status: 400 });
  }

  let message = typeof rawMessage === "string" ? rawMessage.trim() : "";
  if (!message && image) message = DEFAULT_IMAGE_PROMPT;
  if (!message) {
    return NextResponse.json({ error: "`message` is required." }, { status: 400 });
  }

  const parts: Part[] = [{ text: message }];
  if (image) parts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });

  const contents = [
    ...parseHistory(rawHistory).map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: "user" as const, parts },
  ];

  try {
    const ai = new GoogleGenAI({ apiKey });
    const generate = () =>
      ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
        contents,
        config: { systemInstruction: SYSTEM_PROMPT },
      });

    let response;
    try {
      response = await generate();
    } catch (err) {
      // Gemini sheds load with 503 during demand spikes; one short retry usually clears it.
      if ((err as { status?: number } | null)?.status !== 503) throw err;
      await new Promise((r) => setTimeout(r, 1000));
      response = await generate();
    }

    const reply = response.text;
    if (!reply) {
      return NextResponse.json({ error: "The tutor returned no answer. Try rephrasing." }, { status: 500 });
    }
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Gemini error:", err);
    return NextResponse.json({ error: "The tutor is unavailable right now." }, { status: 500 });
  }
}
