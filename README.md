# BelugAI

A friendly AI study buddy for Grades 7–12. Students can type, snap a photo of a problem, or dictate a question, and BelugAI guides them Socratically (hints and questions, not just answers). It only helps with school subjects.

Built with Next.js (App Router), TypeScript, Tailwind CSS and the Google Gemini API (`@google/genai`).

## Run locally

```bash
pnpm install
cp .env.example .env.local   # then add your GEMINI_API_KEY
pnpm dev                     # http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Your Gemini API key (server-side only) |
| `GEMINI_MODEL` | Model id, e.g. `gemini-3.5-flash` |

## Deploy to Vercel

1. Push the repo and import it at vercel.com/new (framework: Next.js).
2. Add `GEMINI_API_KEY` and `GEMINI_MODEL` under Settings → Environment Variables.
3. Deploy. Voice input needs HTTPS, which Vercel provides.

## Notes (POC)

- Voice input uses the browser's Web Speech API (Chrome, Edge, Safari). Other browsers fall back to typing.
- Images are downscaled in the browser before upload to stay under Vercel's request size limit.
- No database or accounts; chat history lives in the browser tab.
