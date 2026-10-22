import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

export const maxDuration = 30;

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

  const raw = (body as { message?: unknown } | null)?.message;
  const message = typeof raw === "string" ? raw.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "`message` is required." }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      contents: message,
      config: { systemInstruction: SYSTEM_PROMPT },
    });
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
