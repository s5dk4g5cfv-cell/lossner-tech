# Observations: publication dates

The reader-facing section is **Observations**. Its internal `journal` section
ID, `content/Journal/` files and `/api/content?directory=Journal&file=…` endpoints
remain unchanged for compatibility. Entries open in the portfolio reading pane;
there are no separate article-page routes to rename. Historical article prose
is preserved, including the old section name inside “Why I Built This Site.”

## Original date evidence

`date` is the original publication day, not the edit or deployment day. Dates
below are verified against saved publication metadata, not inferred from Git
commit timestamps. Git imports and site migrations are not new publication.

| Entry | Original date | Evidence |
| --- | --- | --- |
| Why I Built This Site | 2025-08-20 | Explicit `date` in the earliest surviving Markdown revision, `eb92137bdca18cc9b0ba0e5998edc601cc65754f`. |
| The AI Gold Rush and the Dot-Com Echo | 2025-08-21 | Explicit `date` in the same earliest surviving Markdown revision. |
| What Are We Making Room For? | 2026-09-24 | Approved publication record WORK-2516, Markdown commit `f14ff93eb00b91cac452ed0fbf4cdfcb55e3932d`, production merge `955090ce553a5157d62354a486bfea94652a27c9`. |

The first two dates are the author's recorded publication dates. Independent
hosting logs for their initial publication are not available in this repository;
the September 2025 import timestamp is deliberately **not** substituted for them.
The last date uses Joshua's local publication day (America/Chicago).

## Editing and display

Keep `date` unchanged when editing a title, tags or body. If an original date
cannot be established, leave it absent: the UI displays “Publication date
unknown.” Never fill it from file modification time, build time or today's date.
If an updated date is added later, label it separately; it must not replace
`date`. No updated date is displayed by the current interface.

Both the listing and opened entry use the same `PublicationDate` component:
“Published September 24, 2026,” with semantic `<time datetime="2026-09-24">`.
Formatting is fixed to UTC so the saved calendar day cannot shift by timezone.

## Checks

- `node --test tests/observations.test.mjs`: provenance, exact article preservation,
  unrelated-edit stability, invalid/missing dates and timezone independence.
- `node tests/observations-local.mjs`: owns a temporary local production server,
  runs the browser checks, then stops only that server.
- `node tests/observations-browser.mjs --base-url <url>`: real desktop/mobile
  navigation, listing dates, all opened entries and unchanged content API.
- `npm run build`: Next.js production compilation and type checking.

Browser acceptance uses Chromium at desktop and phone widths, not a physical
phone or a claim about Safari. Screenshots are saved in a run-unique temporary
folder and its path is printed with the results.

Install test dependencies with `npm ci --include=dev`. For a fresh browser cache,
use `PLAYWRIGHT_SKIP_BROWSER_GC=1 npx playwright install chromium` to preserve
other projects' browser versions on shared hosts.
