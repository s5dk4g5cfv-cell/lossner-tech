# lossner.tech

**Practical tools. Reliable delivery.**

I'm Joshua Lossner, an IT professional with a background in release management
and DevOps. [lossner.tech](https://lossner.tech) brings together my experience,
projects, and writing. This repository contains the site and its content.

I think of myself as a **toolsmith**: someone who understands a workflow,
connects the right systems, and makes the work easier to repeat and support.
My contribution is in defining the problem, choosing tools, evaluating the
result, and taking responsibility for how it is delivered.

## Decisions behind the site

### Keep the content portable

Experience, projects, skills, education, and writing live in Markdown files
under [`content/`](content/). YAML frontmatter supplies titles, dates, and other
metadata. Keeping that material in Git makes revisions visible and lets me
reuse my professional record without depending on a particular content editor.
The site reads these files directly; it has no application database.

### Make AI an optional entry point

Visitors can browse the portfolio through ordinary navigation. An AI guide
offers another way to explore the same published background, with optional
speech playback. The guide is instructed to stay grounded in that record and
identify itself honestly as AI. Its answers can still be wrong; the written
portfolio is the reference.

### Use AI with human authorship

I use AI coding tools to help implement and refine the site. I set the direction,
make the tradeoffs, and review the result, with AI assistance in implementation
and verification. This project reflects how I work with tools to deliver
something useful, including the judgment needed to decide what belongs in it.

### Make releases reviewable

GitHub holds the source and pull requests; Vercel builds and hosts the site.
Changes go through a branch preview so I can see the result before releasing
it. The production branch is `main`.

1. Make a focused change on a feature branch and push it to GitHub.
2. Review the Vercel preview and run checks appropriate to the change.
3. Merge the reviewed pull request into `main` when it is ready to publish.
4. Vercel builds the production release; verify it at [lossner.tech](https://lossner.tech).

### Use established building blocks

The site uses Next.js, React, TypeScript, and Tailwind CSS. Markdown rendering,
AI responses, speech, and hosting use existing libraries and services. The
choices keep the work focused on content, integration, and the visitor's
experience.

## Project map

- [`content/`](content/) — professional record, writing, and AI guide instructions.
- [`components/TerminalResume.tsx`](components/TerminalResume.tsx) — portfolio interface and navigation.
- [`app/api/content/`](app/api/content/) — reads the Markdown records.
- [`lib/resumeContext.ts`](lib/resumeContext.ts) — prepares published content for the AI guide.
- [`app/api/chat/`](app/api/chat/) and [`app/api/speech/`](app/api/speech/) — Anthropic and ElevenLabs integrations.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/CONTENT_SCHEMA.md`](docs/CONTENT_SCHEMA.md) — implementation and content conventions.

## Run locally

Use Node.js 24 to match the Vercel project, then:

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Browsing the portfolio does not
require provider credentials. To enable the AI guide or speech, copy
`.env.example` to `.env.local` and set the corresponding API keys. Keep actual
credentials out of Git. Hosted credentials are configured separately for
Vercel Preview and Production environments.

To check the production build locally:

```sh
npm run build
npm start
```

## Contact

[joshua@lossner.tech](mailto:joshua@lossner.tech) · [GitHub](https://github.com/s5dk4g5cfv-cell)
