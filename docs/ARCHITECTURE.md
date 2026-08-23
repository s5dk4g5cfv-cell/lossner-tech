# Architecture (lossner.tech)

- Framework: Next.js App Router through vinext, Markdown content, Tailwind CSS
- Content source: `/content` with frontmatter schema (see docs/CONTENT_SCHEMA.md), bundled at build time for the Sites runtime
- Hosting target: ChatGPT Sites using Cloudflare Worker-compatible ESM output
- Rollback baseline: Vercel production remains untouched until an approved domain cutover

## Invariants
- Static-first; no server database or file storage.
- Page metadata derives from content frontmatter.
- Runtime secrets are configured in Sites settings and never committed.
- Public and assistant-only content visibility must stay explicit.

## Routing
- App Router under `/app`
- Shared layout and metadata per route segment

## Content
- All resume and writing records use frontmatter defined in `docs/CONTENT_SCHEMA.md`.
- `lib/content.ts` bundles Markdown into the deployment; deployed request handlers do not read the filesystem.

## API routes

- `/api/content` serves only approved public directories and excludes hidden records.
- `/api/chat` streams the bounded public portfolio assistant through the OpenAI Responses API when `OPENAI_API_KEY` is configured. The default model is `gpt-5.6-luna`, configurable through `OPENAI_MODEL`, and response storage is disabled.
- `/api/speech` is a deprecated compatibility route that returns HTTP 410 in the Sites edition.
