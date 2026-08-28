---
title: AI for Development — Enterprise Proof of Concept
company: Grinnell Mutual Insurance
role: Platform Builder & Evaluation Lead
timeline: 2026
tags: [ai, governance, evaluation, platform engineering]
---
## AI for Development — Enterprise Proof of Concept
**Grinnell Mutual Insurance:** ***May – July 2026***

**Overview**
A proof of concept to answer one question: can an AI coding assistant do real engineering work inside a regulated insurance environment — safely, auditably, and under the same controls as any other engineer? I proposed the set of test cases that would answer it, was asked to join the project as a builder, and then built the platform the evaluations ran on.

The work product was a governed agent platform and a twelve-case evaluation program, delivered over roughly three months: ~28,500 lines of TypeScript/Node across 244 files, 14 forward-only database migrations, 24 architecture decision records, and 14 purpose-built agents.

**The Platform**
- **Observability substrate** — every agent execution recorded with duration, token use, and cost, alongside an incident record.
- **Agentic runner** — agent loader and phased execution over the Claude Agent SDK, with a transient-retry sleeve.
- **Secret resolution** — a provider seam backed by the enterprise secret-management platform plus a redaction registry, so an agent never holds a secret value.
- **Guardrail hooks** — a pre-execution secrets/PII gate that blocks a tool call *before* it happens, and post-execution tool timing.
- **Operator dashboard** — a Next.js application surfacing runs, cost, the work board, documents, sessions, and infrastructure views, reading the database directly through a shared query layer.
- **Work substrate behind an authenticated API** — per-principal tokens, scopes, human-only sign-off, and an audit log — plus a read-only MCP server so agents read the board under their own identity.
- **Tiered agent memory** — boot context, an episodic store with mask-and-store, a curated index tier, and session sealing.

Containerized behind a CI pipeline that auto-deploys on push, with an internal package registry for kit distribution and a CI-health watchdog reporting to the dashboard.

**The Governance Model**
The part that made the POC credible to Legal, Assurance Services, and InfoSec — and as much of the deliverable as the code:

- **Agents advise, humans decide.** Consequential action on systems of record is a human step, structurally enforced rather than requested. The review agent cannot merge; only the CI service can touch the runtime.
- **Every code change traces to a work item**, moves to review for human sign-off, and lands only through a branch → pull request → human merge path.
- **Cite evidence, report confidence, never guess** — written into every agent persona and enforced at review.
- **Role-based access control** with per-agent identity, so every write records the acting principal.
- **An AI Decision Log** — a six-element audit record covering repeatability, hallucination check, verification source, and confidence — agreed with Legal and Assurance Services and produced as a generated report for every completed unit of work.

**The Evaluation**
Twelve concrete evaluations, each a real task from the environment, run as a scored exercise. Ten completed, each producing artifacts, evidence, a verdict — and, deliberately, its own recorded limits.

- **Configuration-management translation** — 12 repositories surveyed, load-bearing modules translated with zero lint findings, delivered as a reviewable pull request.
- **CI pipeline analysis** — 4 findings, all approved, applied, and verified; 24.2 GB of build storage reclaimed.
- **Blind container troubleshooting** — 3 of 3 planted faults found and fixed with zero false positives, at a compute cost of about thirty cents.
- **Blind incident root-cause analysis** — 3 of 3 diagnosed with roughly 32 source citations and zero fabrications, in 73–142 seconds per diagnosis.
- **Codebase onboarding** — a 743-line guide generated from ~1.5M tokens of source; a fresh-reader comprehension quiz scored 15/16, and an independent fact-check 17/20 with corrections landed as visible commits.
- **Automation from plain-English requests** — 3 of 3, machine-graded by sealed exit-code checks; the generated backup routine actually restored.
- **Blind code review** — every planted defect found with zero false positives, plus two unplanned real findings, while correctly declining a planted over-eagerness trap.
- **Disaster-recovery runbooks** — 5 runbooks totaling 1,205 lines, which also established that no database backup automation existed.
- **Self-service deployment with safety rails** — designed, built, and proven live: deploy *and* rollback through the full governed path in a single day.

**The Methodology**
The transferable part is the protocol, not the scores:

- **Blind fixtures with sealed answer keys**, authored by a separate isolated agent and fingerprinted before any run.
- **Over-eagerness traps** — deliberately correct code planted beside the defects, to test whether the reviewer leaves working code alone.
- **External standards as the defect source** (OWASP, CIS) rather than the agent's own checklist, with one weakness class left off the checklist as a fair miss-test.
- **Machine grading wherever the artifact is runnable**, removing human judgment from scoring entirely.
- **Recorded protocol deviations** — where the design was compromised, the deviation was written down and the mitigation published rather than smoothed over.
- **An honest-limits section on every verdict**, stating what the case did *not* prove.

**Findings That Outlived the Scores**
- Four pre-existing plaintext-secret exposures — including a live private key — surfaced in legacy configuration repositories and handed to the responsible team. A problem that existed independent of any AI work.
- A missing database backup practice, discovered by the runbook case and now tracked remediation.
- A prior production outage re-derived from build data alone, with the largest recommendation landing precisely on that outage's still-open vector.
- A governance gap — a permission control the execution path bypassed — surfaced by correcting a documentation misread.

**Honest Limits**
This was an evaluation, not a deployment; nothing from the test cases rolled into production. In the head-to-head security scan, an off-the-shelf review edged the governed agent on raw detection — the platform's argument there is coverage, context, and accountability, not out-detecting a strong ad-hoc reviewer. Two cases used synthetic fixtures because no real archive existed, one case is recorded as half-measured because its human review never happened, and the generated runbooks were never drilled.

**Impact**
- Demonstrated that AI-assisted engineering can meet regulated-industry controls when identity, audit, and human sign-off are designed in rather than bolted on.
- Produced a reusable evaluation protocol for AI capability claims, in a field where most assessments are anecdotes.
- Delivered fourteen purpose-built agents — each with a persona, knowledge base, anti-pattern catalog, and scoped tool permissions — reusable beyond the test that created them.
