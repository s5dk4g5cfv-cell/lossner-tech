# lossner.tech

This repository powers Joshua Lossner’s personal website (**lossner.tech**) and
its preservation-first migration to ChatGPT Sites.

## What this repo is optimized for
- **Codex-first** workflows: tasks are provided as structured prompts; Codex produces small, testable diffs.
- **Static-first** site using the Next.js App Router through vinext, Markdown content, and Tailwind CSS.
- **Sites-compatible** Cloudflare Worker output with no database or file-storage dependency.
- **Clear guardrails**: see `.codex/` and `docs/`.

## Quick start
- Use Node.js 22.13 or newer.
- Run `npm install`, then `npm run dev`.
- Read `docs/ARCHITECTURE.md` and `docs/CONTENT_SCHEMA.md`
- For Codex tasks, use `.github/ISSUE_TEMPLATE/codex-task.md`
- Repo map: `.codex/REPO_MAP.txt` (regenerate: `tree -I 'node_modules|.git|.next|build' > .codex/REPO_MAP.txt`)

## Branches
- `main` → current production baseline (Vercel until an approved domain cutover)
- `feat/chatgpt-sites-migration` → Sites migration and review candidate
- `test` → preview

## Conventions
- See `docs/STYLEGUIDE.md` (code) and `docs/COPY_TONE.md` (site text).

## Hosting and analytics

- `.openai/hosting.json` links the local source to ChatGPT Sites after provisioning.
- Sites records traffic automatically; the former Vercel Analytics client dependency is not used.
- Hosted secrets belong in Sites settings, never in `.openai/hosting.json` or committed files.

## Public AI behavior

- The portfolio labels the assistant as an AI representation of Joshua, not Joshua live.
- The assistant uses the OpenAI Responses API and defaults to GPT-5.6 Luna; `OPENAI_MODEL` can override the model.
- Only public content records are available through `/api/content`; voice guidance and hidden projects remain server-side.
- Public messages and recent history are bounded before any model-provider request, and API responses are requested with storage disabled.
- `OPENAI_API_KEY` must be supplied locally or as a Sites secret; a ChatGPT subscription does not inject an API key into the site.
- `/api/speech` returns HTTP 410 during the Sites migration. The former UI never exposed speech controls and its response contract was incompatible; removal of the compatibility route requires a separately approved breaking change.
