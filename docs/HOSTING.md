# Hosting and previews

## Source and hosting

- **Public site:** https://lossner.tech
- **Local source:** `/Users/joshua/Projects/lossner.tech` (with the dot)
- **GitHub source:** https://github.com/s5dk4g5cfv-cell/lossner-tech (private)
- **Default Git remote:** `origin`, pointing to GitHub
- **Recovery remote:** `hearth-gitea:joshua/lossner-tech.git`, named `hearth`
- **Host:** Vercel, project `lossner-tech` in `joshuas-projects-d90002b6`
- **Vercel project ID:** `prj_3VTCbSluz3tkRHdmnXXzIsRTxkpc`
- **Vercel team ID:** `team_BNrbt2KJSiG4Iv35VYuQ9KEy`

GitHub holds the current Next.js source. Both Git histories are preserved;
`archive/chatgpt-sites-20260915` retains the earlier GitHub main revision.
The obsolete local Sites checkout is recoverable in macOS Trash at
`/Users/joshua/.Trash/lossner-tech`.

## Preview setup

The local `.vercel/project.json` links to the existing Vercel project and is
Git-ignored. Production and preview environment variables are configured on
Vercel; their values belong outside Git. Preview URLs require Vercel sign-in.

Vercel is connected to the private GitHub repository, with `main` as the
production branch. Pushes to working branches create preview deployments;
merges to `main` publish production deployments. Connection settings live in
[project Git settings](https://vercel.com/joshuas-projects-d90002b6/lossner-tech/settings/git).

The workflow is:

1. Create a `work/WORK-N-description` branch from `main`.
2. Push it to `origin` and open a pull request.
3. Wait for the Vercel check to pass, then review its preview before merging.
4. Merge to `main` only when Joshua approves publishing the changes.

Use a commit author associated with Joshua's connected GitHub account so
Vercel can verify deployment access. The current account's GitHub noreply
address is `320252185+s5dk4g5cfv-cell@users.noreply.github.com`.
AI-assisted commits can retain an `Ivy <ivy@cora.local>` co-author trailer.

## Production baseline

Verified September 15, 2026: `lossner.tech` serves deployment
`dpl_HckHozW7HULSYjS6s619AjoFwQEw`, built from source revision
`e9678a99c6524a4b3d0e4773cc6dea77da50c112` using the Vercel CLI.
The GitHub source reconciliation preserves that application tree; only hosting
documentation differs. GitHub setup has not changed the public deployment.

Recheck the domain and production deployment before publishing changes.
