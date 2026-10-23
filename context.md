You are an expert full-stack engineer building a Proof-of-Concept (POC) web application.

CRITICAL MODE INSTRUCTION: 
DO NOT write or execute implementation code yet. 
Your current task is ONLY to output a concrete, step-by-step implementation plan. 
Once I review and approve your plan, you will begin coding strictly slice-by-slice.

### Project Overview
- **Product:** "BelugAI" — an AI Academic Tutor for Grade 7 to Grade 12 students.
- **Goal:** Working, robust, multimodal web POC built and deployed to Vercel.
- **Tone/Vibe:** Clean, approachable, and playful. Use a soft sky/cyan background gradient, rounded-2xl bubbles, and an inline SVG white cat mascot with pink ears/nose.
- **Scope:** Help only with homework and explaining difficult concepts using the Socratic method.

### Architecture & Tech Stack
1. **Framework:** Next.js (App Router, TypeScript, Tailwind CSS).
2. **Backend API:** Next.js Route Handler (`app/api/tutor/route.ts`).
3. **LLM Provider:** Google Gemini API (`@google/genai` SDK) using `gemini-3.5-flash` via `GEMINI_API_KEY` and `GEMINI_MODEL` env variables.
4. **Markdown/Math:** `react-markdown`, `remark-math`, `rehype-katex`, and `katex` (Note: `import 'katex/dist/katex.min.css'` must be in `app/layout.tsx`).

### Core Features & Technical Requirements
1. **Text API & Chat UI (Slices 1 & 2):**
   - Multi-turn history mapped correctly to the Gemini SDK `contents` array.
   - UI features user messages on the right (blue) and tutor messages on the left (gray).
   - "Bouncing dots" loading state. 
   - Retry logic (1 retry) on `503 Service Unavailable` errors.
   - Textarea must auto-grow based on content height.

2. **Image Upload & Vision (Slice 3):**
   - `<input type="file" accept="image/jpeg,image/png,image/webp">` triggered by a paperclip icon.
   - **CRITICAL VERCEL CONSTRAINT:** Vercel has a 4.5MB request body limit. You MUST downscale images client-side via `<canvas>` (max 1280px longest side, JPEG q=0.85) before converting to Base64 to ensure the payload stays under 3MB.
   - Display a thumbnail preview above the composer with an "X" to remove.

3. **Voice Input (Slice 4):**
   - Microphone icon next to the attachment button (44x44px touch targets for mobile).
   - Use browser-native `window.SpeechRecognition` or `window.webkitSpeechRecognition`.
   - Append transcribed text live to the textarea. Show a pulsing red state while listening.
   - Handle unsupported browsers gracefully with an alert. No audio files are sent to the backend.

4. **Strict Guardrails (System Prompt):**
   - Teach Socratically: Never give the final answer. Give one hint or guiding question at a time.
   - Strict Gating: "You are strictly limited to Grade 7-12 academic subjects. If the user asks about or uploads an image related to enterprise IT, software architecture, university-level engineering, medical advice, legal advice, or ANY topic outside standard middle/high school curricula, you MUST politely refuse to answer. Say something like: 'I can only help with Grade 7-12 school subjects!'"

### Development Process & Git Rules
Work in vertical slices (Slice-by-slice development).
At the end of each slice:
1. Verify the slice locally (type checks, dev server).
2. Automatically stage and commit changes to local Git with standard conventional commit messages (e.g., `feat(ui): add image upload`).
3. Pause for my human QA and explicit approval before planning or moving to the next slice.

### What You Must Output Right Now:
Produce a detailed implementation blueprint breaking this down into 5 vertical slices (API, Chat UI, Image Upload, Voice/Guardrails, Production Polish). Document the file structure, the specific technical approach for the canvas image compression, and the exact steps for each slice. 

Wait for my explicit approval before modifying any files or installing packages.