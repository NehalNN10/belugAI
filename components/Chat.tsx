"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Mascot from "./Mascot";

type Message = { role: "user" | "model"; text: string; error?: boolean };

const SUGGESTIONS = ["Explain gravity", "What is a prime number?", "Help me understand fractions"];
const ERROR_TEXT = "Oops, I knocked something off the shelf 🐾 Please try again.";
const MAX_TEXTAREA_PX = 120; // ~5 rows

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_PX)}px`;
  }

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || isLoading) return;

    const history = messages
      .filter((m) => !m.error)
      .map(({ role, text }) => ({ role, text }));

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    requestAnimationFrame(resizeTextarea);
    setIsLoading(true);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
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

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-2">
        {messages.length === 0 && !isLoading && (
          <div className="mt-10 text-center">
            <Mascot className="mx-auto h-24 w-24" />
            <h2 className="mt-3 text-lg font-semibold text-sky-900">Hi! I&apos;m BelugAI.</h2>
            <p className="mt-1 text-sm text-sky-700">
              Ask me about math, science, English, or history. I&apos;ll help you figure it out!
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
              <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-blue-500 px-4 py-2 text-white shadow-sm">
                {m.text}
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
        className="flex shrink-0 items-end gap-2 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <textarea
          ref={textareaRef}
          value={input}
          rows={1}
          disabled={isLoading}
          placeholder="Ask a question…"
          aria-label="Your question"
          onChange={(e) => {
            setInput(e.target.value);
            resizeTextarea();
          }}
          onKeyDown={onKeyDown}
          className="max-h-[120px] min-h-11 flex-1 resize-none rounded-2xl border border-sky-200 bg-white px-4 py-2.5 text-base text-gray-900 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="h-11 shrink-0 rounded-full bg-blue-500 px-5 font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </>
  );
}
