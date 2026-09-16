---
title: AI Bake-Off — Enablement and Agency Management Modernization
company: Grinnell Mutual Insurance
role: Framework & Guardrails Owner · Technical Driver
timeline: 2026–Present
status: in-progress
tags: [ai, data migration, tooling, enablement]
---
## AI Bake-Off — Enablement and Agency Management Modernization
**Grinnell Mutual Insurance:** ***July 2026 – Present***

**Overview**
I helped seven business-sponsored teams put AI assistance to practical use during a company-wide, week-long event involving fourteen people. My first responsibility was making the work possible: usable workstation tooling, access, guardrails, documentation, and a way to see what happened.

During the event, I also served as the technical driver on the Agency Management team alongside a business owner and two subject-matter experts. I used AI assistance to turn their domain knowledge and requirements into a working prototype, while checking migration results and keeping unresolved business decisions visible. **The prototype was selected to go to production, and its presentation was selected for the company town hall.** It remains under active refinement.

---

### Part One — Enablement for Seven Teams

**A one-command workstation setup.** A PowerShell provisioner, safe to re-run, that creates the policy-permitted program directories, installs the toolbox from a local bundle rather than the internet, installs Git, Node.js, and the AI tooling, verifies each is reachable, and repairs PATH. Covered by a Pester test suite.

**A distributed developer kit.** A versioned package published to the internal npm registry, with a publish job and drift detection so kit changes actually reached developers instead of sitting merged.

**Guardrails on every seat.** A pre-execution gate that blocks a tool call *before* it happens if it contains something that looks like a credential or personal data. I extended it with organization-specific identifier patterns, Luhn-gated card detection, and keyword-anchored password and date-of-birth patterns; added a verification tool that *proves* the gate is wired rather than assuming it; gave blocked developers a documented escape hatch; and made the gate record what it blocked into the session record.

**Transparency instrumentation.** Every developer session reported duration, tokens, estimated cost, a one-line summary, and the prompts the developer typed, scrubbed for secrets. Code and file contents were never transmitted. Per-seat opt-out for sensitive folders, with the arguments for and against fuller capture written up as a design record rather than decided quietly.

**Six encoded skills and four audience-specific handbooks** — written for developers, operators, auditors, and Legal — covering container builds, Kubernetes deployment, vulnerability scanning, source control, and writing new skills.

**The workstation problem.** The virtual desktops the technical drivers were issued could not do the work as provisioned: a JRE 8 and no build tool, no container runtime of any kind, no admin rights to add one, and an application-control policy that silently blocked programs launched from a user-profile path. A team could write a containerized application and have no way to build the container.

Finding that out early was most of the value. I proved a build path that needs no build tool — layering a built application onto a base image with no daemon and no admin rights — and shipped it as a skill with its one real limitation stated up front. I established what was actually true about the target platform against two rounds of wrong assumptions, including my own over-correction, and left the correction history visible rather than quietly rewriting it. I produced a ranked risk map of the eight likeliest first failures, each with a named owner, separating what had to be settled before the day from what to staff on the day.

**Outcome.** Measured against the bar set for the event — a secrets and PII guardrail on every seat, tooling working on the virtual desktops, prompts recorded, and dependency scanning live — it held: 114 session records from 7 people, the gate proven in production with three real blocks, and an audit report produced for the enterprise architect.

---

### Part Two — Agency Management System Modernization

**The problem.** Replace a legacy IBM green-screen agency-management system — one whose changes were impractical because they took so long, and which only a small group of specialists could program or query — with a modern application on an **Organization → Agency → Location → Producer** data model.

**The constraint.** Three build days, with the demo on the fourth.

**Making the tools usable.** The workstation had a JRE 8, no build tool, and no admin rights, so the first deliverable was the toolchain itself: a JDK and build tool installed into the user profile, both checksum-verified and activated per shell so the machine-wide configuration other tooling depended on was left untouched. The AI-assisted prototype used Java 21, Spring Boot 3.5, Gradle, embedded Tomcat, React 19 with TypeScript and Vite, SQL Server, and Flyway, packaged as one jar serving both UI and API.

**Day one — profile and model.** Profiled all nine legacy landing tables — **3.7 million rows** — using metadata and aggregates only, never reading a row value. Established the load-bearing findings: the producer-to-agency relationship is many-to-many, with a substantial share of producers placing business at more than one agency; the general-agent record deterministically derives both the parent organization and its home office; and lifecycle and date-format rules across the estate. Stood up eighteen tables in the target schema with an effective-dated type registry and database-enforced domain safety, verified by a live negative test.

**Day two — application layer.** React front end, a type-management screen demonstrating effective dating, full CRUD across organizations, agencies, locations, producers and placements, typed addresses and contacts, and a system-versioned temporal audit trail on all nine core tables — with each business ruling recorded and traced back to source evidence.

**Day three — the migration utility.** An eleven-step pipeline, runnable with a full-reset flag, executing end to end in about nine minutes including the reset. **74 reconciliation lines, zero expectation mismatches** — every exclusion counted and reconciled rather than silently dropped.

**The part that made it credible.** The legacy source has no declared foreign keys; it is a flat extract, and the originating system enforces its relationships internally. Every relationship therefore had to be *proved* count-for-count from cardinality evidence before it could be migrated. **646 items were surfaced to a human review queue rather than silently patched** — derivations genuinely needing a business eye, unmapped legacy codes, invalid dates each carrying a proposed repair value, and structural edge cases. Uncertainty was made visible and routed to the business instead of guessed away.

**Regulated-environment floors, held throughout.**
- Tax and federal identifier columns exist in the model and were never populated.
- A legacy plaintext password column was ruled *drop, never migrate*, and raised with security through a secure channel.
- All profiling and name-parsing design used aggregates only — no row values were ever read.
- The legacy database was read-only, enforced **in code** by a guard that refuses to run any statement placing a legacy table in a write position, covered by a unit test rather than a convention.
- 78 of 79 reported dependency vulnerabilities fixed before the demo.

**Deployment.** Built the container without a container runtime or admin rights and deployed to an interim host, negotiating a written touch-only-your-own-container boundary because the box also ran other workloads. Separately recorded a working Kubernetes deployment recipe against the internal platform, including the manifest and the platform findings, and fed it back to the platform team.

**The business case.** An external vendor proposal ran to seven figures across implementation, six years of licensing, and staff training. The in-house estimate after the build week was a small fraction of that, with roughly one more month of refinement — a projected first-year saving in the high six figures if the project proceeds. That figure is a business projection, not realized savings.

**The presentation.** Built the presentation package and ran the technical half of a company-wide presentation: an eight-scene product tour and demo film with a narration script and a recording rig carrying a fail-safe privacy blur; a live-fix act in which three defects recorded on film were fixed in front of the audience in about sixteen seconds, with the same screens shown working during Q&A; rehearsed four times with a full, tested back-out so the system sat in its pre-fix state until the window opened; and a fact sheet as the single source of truth, where every number on screen had to appear with its source or it did not go on screen.

**After the event.** The project did not stop at the demo. A standing refinement loop now runs — the business supplies requests, I work through them with AI assistance, and the results are reported back for review. Recent batches have delivered placement-scoped data, producer lifecycle states, role-based access, an employee and principal model, and a migration rewrite around the true legacy primary keys, across nine stacked pull requests and Flyway migrations V18 through V26. The maintained codebase map, data-model decision record, legacy profile, and AI decision log support that review loop.

**Implementation Detail.** The repository totals at this project snapshot were 98 commits and 31 pull requests, ~7,500 lines of Java and ~8,000 lines of TypeScript/React, and 26 database migrations. That is the scale of the AI-assisted implementation; my contribution is better understood through the tooling, integration decisions, verification, and delivery work described above.

**Honest Limits**
This is a prototype under active refinement, not a production system. Two-way synchronization with the legacy system was never built, and write-back to the system of record remains advisory by design. The outcome belongs to a team — the business owner framed the problem and the subject-matter experts supplied the domain rulings every migration decision depended on. My contribution was directing the AI-assisted technical work, making the tooling usable, integrating the pieces, and checking the results against the team’s requirements.

**Impact**
- Delivered a working replacement data model and a reconciled migration over 3.7 million rows of legacy data in three build days, under constraints that were solved rather than escalated.
- Selected to go to production, with the presentation selected for the company town hall.
- Established the enablement layer — guardrails, kit, and documented procedures — that let seven business-sponsored teams work at all.
