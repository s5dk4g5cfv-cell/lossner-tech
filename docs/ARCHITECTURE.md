# Architecture

The portfolio uses Next.js App Router, React, TypeScript, and Tailwind CSS.
GitHub stores the source; Vercel builds and hosts the application with Node.js 24.

## Interface

- `app/page.tsx` renders the client-side `components/TerminalResume.tsx` interface.
- `app/layout.tsx` defines page metadata, fonts, and Vercel Analytics.
- `app/globals.css` and `tailwind.config.js` hold the styling configuration.

## Content and integrations

- `content/` contains Markdown with YAML frontmatter, following [the content schema](CONTENT_SCHEMA.md).
- `app/api/content/route.ts` reads the files from the deployed filesystem and returns navigation records or document content.
- `lib/resumeContext.ts` assembles published content and voice instructions for the AI guide.
- `app/api/chat/route.ts` streams Anthropic responses; `app/api/speech/route.ts` calls ElevenLabs for speech playback.
- There is no application database. Browsing content does not require either AI provider.
- Provider credentials stay in environment variables on the server. `.env.example` documents the supported variables.

## Delivery

Pushes to feature branches generate Vercel previews. Reviewed pull requests merge
into `main`, the configured production branch, which triggers a production build.
Verify the resulting deployment at [lossner.tech](https://lossner.tech) after release.
