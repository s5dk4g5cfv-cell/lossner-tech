---
title: Coherenceism.media
company: Personal Project
role: Producer & Developer
timeline: 2026–Present
tags:
---
## Coherenceism.media
**Personal Project:** ***2026–Present***

**Overview**
A streaming music platform showcasing AI-composed music grounded in philosophical field observations. Each song originates from a coherenceism.blog post — a multi-agent band (lyricist, guitarist, bassist, producer) transforms the observation's themes into original music produced through Suno. The platform hosts 16 albums, 185 tracks across 5 philosophical rivers, with a full catalog management and one-command publishing pipeline.

**Key Contributions**
- Built the streaming application in Next.js with Tailwind CSS, deployed on Vercel. Features include album browsing, track playback, curated home page, and links back to source field observations.
- Designed a multi-agent music production workflow: Poe (lyrics) → Fret (guitar direction) → Thrum (bass/groove) → Poe (drums) → Riff (synthesis for Suno) → Vox (quality audit) — each agent bringing distinct musical identity and compressed craft memory.
- Created a unified publish pipeline (`publish-song.js`) that resolves Suno share URLs, downloads MP3s, uploads to Vercel Blob Storage, updates catalog metadata, and triggers deployment — replacing manual multi-step publishing with a single command.
- Managed a living archive of 144+ tracks with automated catalog rebuilds, frontmatter-driven metadata, and batch upload tooling that survived a 7-attempt debugging gauntlet (DNS throttling, shell compatibility, stdin consumption).

**Technical Stack**
- Next.js, Tailwind CSS, TypeScript, Vercel (hosting + Blob Storage)
- Suno (AI music generation), ElevenLabs (agent voice synthesis)
- CORA agent pipeline (6 music agents with distinct personas and craft memories)
- Automated catalog management with JSON rebuilds from markdown frontmatter

**Impact**
- Proved that AI-generated music can carry genuine philosophical weight when grounded in meaningful source material and produced through agents with craft identity.
- Established a complete content-to-music pipeline: blog observation → agent band → produced track → streaming platform — with minimal manual intervention.
