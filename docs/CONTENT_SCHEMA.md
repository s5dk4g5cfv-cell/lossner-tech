# Content Schema

This site reads markdown content from `/content/**`. Each subdirectory uses a small frontmatter shape so the API can normalize titles, ordering, and metadata in the terminal UI.

## General conventions
- Filenames may be prefixed with an ordinal (`01_`, `02-`) to control ordering.
- All files are UTF-8 markdown.
- `tags` is optional across content types; use an empty array when you do not have tags yet.

## Experience entries (`/content/Experience/*.md`)
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Role name shown in the UI |
| `company` | string | Employer |
| `location` | string (optional) | City and state or remote |
| `start` | `YYYY-MM` | Month the role began |
| `end` | `YYYY-MM` or `present` | Use `present` for active roles |
| `tags` | `string[]` (optional) | Skills or themes |

The markdown body carries the narrative, headings, and bullet lists that render inside the chat stream.

## Education entries (`/content/Education/*.md`)
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Shorthand title for the credential |
| `degree` | string | Full degree name |
| `school` | string | Institution |
| `location` | string | Campus or delivery mode |
| `start` | `YYYY-MM` | Program start |
| `end` | `YYYY-MM` | Program completion |
| `tags` | `string[]` (optional) | Focus areas |

## Project entries (`/content/Projects/*.md`)
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Project title |
| `company` | string | Organization or client |
| `role` | string | Capacity you served in |
| `timeline` | string | Free-form timeline (e.g., `2015-2016`) |
| `tags` | `string[]` (optional) | Technologies or themes |

## Skills entries (`/content/Skills/*.md`)
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Skill category name |
| `category` | string | Usually `skills`; useful for filtering |
| `aliases` | `string[]` (optional) | Search keywords |
| `tags` | `string[]` (optional) | Related concepts |

## Observations entries (`/content/Journal/*.md`)
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Post title |
| `date` | `YYYY-MM-DD` (optional) | Original publication day; preserve across edits. Missing/invalid values display “Publication date unknown.” |
| `order` | number (optional) | Smaller numbers sort to the top |
| `tags` | `string[]` (optional) | Topics |

## About entries (`/content/About/*.md`)
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Section heading |
| `category` | string | High-level grouping |

The `content` API strips `title` and any `order` field from metadata after deriving display data. Keep long-form copy in the markdown body.

See [Observations](OBSERVATIONS.md) for original-date provenance and compatibility.
