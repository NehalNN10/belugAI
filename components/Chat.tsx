"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Mascot from "./Mascot";

type Message = {
  role: "user" | "model";
  text: string; // what the API receives as this turn's text
  image?: string; // data URL, display only
  hideText?: boolean; // image-only sends: keep default prompt out of the bubble
  error?: boolean;
};
type Attachment = { dataUrl: string; mimeType: string };

const SUGGESTIONS = ["Explain gravity", "What is a prime number?", "Help me understand fractions"];
const ERROR_TEXT = "Oops, I knocked something off the shelf 🐾 Please try again.";
const IMAGE_ONLY_PROMPT = "Help me with the problem in this image.";
const MAX_TEXTAREA_PX = 120; // ~5 rows
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1280;

// Downscale + re-encode as JPEG so the request stays well under Vercel's 4.5 MB body limit.
function fileToResizedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.fillStyle = "#ffffff"; // transparent PNGs would otherwise turn black as JPEG
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_PX)}px`;
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fileInput = e.target;
    const file = fileInput.files?.[0];
    fileInput.value = ""; // lets the same file be picked again later
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      alert("That image is over 5 MB. Please pick a smaller one.");
      return;
    }
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setAttachment({ dataUrl, mimeType: "image/jpeg" });
    } catch {
      alert("Sorry, I couldn't read that image. Try a JPEG, PNG or WebP photo.");
    }
  }

  async function send(raw: string) {
    const typed = raw.trim();
    if ((!typed && !attachment) || isLoading) return;

    const text = typed || IMAGE_ONLY_PROMPT;
    const sentImage = attachment;
    const history = messages
      .filter((m) => !m.error)
      .map(({ role, text }) => ({ role, text }));

    setMessages((prev) => [
      ...prev,
      { role: "user", text, image: sentImage?.dataUrl, hideText: !typed && !!sentImage },
    ]);
    setInput("");
    setAttachment(null);
    requestAnimationFrame(resizeTextarea);
    setIsLoading(true);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          ...(sentImage && {
            image: { base64: sentImage.dataUrl.split(",")[1], mimeType: sentImage.mimeType },
          }),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || typeof data?.reply !== "string") throw new Error(data?.error ?? "Request failed");
      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "model", text: ERROR_TEXT, error: true }]);
    } finally {
      setIsLoading(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  }

  const canSend = !isLoading && (input.trim() !== "" || attachment !== null);

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-2">
        {messages.length === 0 && !isLoading && (
          <div className="mt-10 text-center">
            <Mascot className="mx-auto h-24 w-24" />
            <h2 className="mt-3 text-lg font-semibold text-sky-900">Hi! I&apos;m BelugAI.</h2>
            <p className="mt-1 text-sm text-sky-700">
              Ask me about math, science, English, or history. You can even snap a photo of a problem!
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm text-sky-800 shadow-sm transition hover:bg-sky-100"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] break-words rounded-2xl rounded-br-md bg-blue-500 px-4 py-2 text-white shadow-sm">
                {m.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.image}
                    alt="Your upload"
                    className={`max-h-60 w-auto max-w-full rounded-xl ${m.hideText ? "" : "mb-2"}`}
                  />
                )}
                {!m.hideText && <div className="whitespace-pre-wrap">{m.text}</div>}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div
                className={`max-w-[85%] break-words rounded-2xl rounded-bl-md px-4 py-2 shadow-sm [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 ${
                  m.error ? "border border-red-200 bg-red-50 text-red-800" : "bg-gray-100 text-gray-900"
                }`}
              >
                {m.error ? (
                  m.text
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {m.text}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ),
        )}

        {isLoading && (
          <div className="flex justify-start" role="status" aria-live="polite">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 shadow-sm">
              <span className="sr-only">BelugAI is thinking</span>
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-2 w-2 animate-bounce rounded-full bg-sky-500"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="shrink-0 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-end gap-2 rounded-3xl border border-sky-200 bg-white p-2 shadow-sm focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-200">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            aria-label="Attach image"
            title="Attach a photo of your problem"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sky-600 transition hover:bg-sky-100 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {attachment && (
              <div className="relative w-fit pt-1 pr-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={attachment.dataUrl} alt="Attachment preview" className="h-20 w-auto rounded-xl border border-sky-100" />
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  aria-label="Remove image"
                  className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-xs leading-none text-white hover:bg-gray-900"
                >
                  ×
                </button>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={input}
              rows={1}
              disabled={isLoading}
              placeholder={attachment ? "Add a note (optional)…" : "Ask a question…"}
              aria-label="Your question"
              onChange={(e) => {
                setInput(e.target.value);
                resizeTextarea();
              }}
              onKeyDown={onKeyDown}
              className="max-h-[120px] min-h-10 w-full resize-none bg-transparent px-2 py-2 text-base text-gray-900 outline-none disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={!canSend}
            className="h-10 shrink-0 rounded-full bg-blue-500 px-5 font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </>
  );
}
