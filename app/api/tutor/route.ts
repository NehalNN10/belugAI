import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

export const maxDuration = 30;

const MAX_HISTORY = 20;

type Turn = { role: "user" | "model"; text: string };

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

  const { message: raw, history: rawHistory } = (body ?? {}) as {
    message?: unknown;
    history?: unknown;
  };
  const message = typeof raw === "string" ? raw.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "`message` is required." }, { status: 400 });
  }

  const contents = [
    ...parseHistory(rawHistory).map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: "user" as const, parts: [{ text: message }] },
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
