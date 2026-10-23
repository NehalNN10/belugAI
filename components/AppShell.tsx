"use client";

import { useState } from "react";
import About from "./About";
import Chat from "./Chat";
import Mascot from "./Mascot";

export default function AppShell() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-2xl flex-col">
      <header className="flex shrink-0 items-center gap-2 px-4 py-2">
        <button
          type="button"
          onClick={() => setIsAboutOpen((open) => !open)}
          aria-expanded={isAboutOpen}
          aria-label={isAboutOpen ? "Close about" : "About BelugAI"}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition hover:bg-sky-100 active:scale-95"
        >
          {isAboutOpen ? (
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-sky-700"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <Mascot className="h-10 w-10" />
          )}
        </button>
        <div>
          <h1 className="text-xl font-bold leading-tight text-sky-900">BelugAI</h1>
          <p className="text-sm text-sky-700">Your study buddy for Grades 7–12</p>
        </div>
      </header>

      {/* Chat stays mounted so history, draft and attachment survive the toggle. */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col" inert={isAboutOpen} aria-hidden={isAboutOpen}>
          <Chat />
        </div>
        {isAboutOpen && <About />}
      </div>
    </div>
  );
}
