---
title: CORA — Coherent Operating & Reasoning Architecture
company: Personal Project
role: Creator & Systems Architect
timeline: 2024–Present
tags:
---
## CORA — Coherent Operating & Reasoning Architecture
**Personal Project:** ***2024–Present***

**Overview**
CORA is a filesystem-native personal AI infrastructure that enables named AI agents to hydrate themselves with identity, context, and capabilities through structured Markdown files with zero application dependencies. Built on the philosophical foundation of Coherenceism, CORA treats the filesystem as an operating system for thought — knowledge isn't stored in databases but woven into an interconnected web of human-readable text files. Every file is markdown, every procedure is text, every workflow is executable by any sufficiently capable AI agent. Radically portable: no migrations, no vendor lock-in, no bit rot.

**Key Contributions**
- Designed a multi-agent system with 40+ specialized agents, each with distinct personas, compressed memory files, skills, and handoff patterns — enabling orchestration workflows where agents invoke other agents with full context isolation.
- Built a compressed memory schema achieving ~60-70% token reduction while preserving semantic meaning, allowing agents to maintain identity, relationships, and institutional knowledge across sessions.
- Created a heartbeat system for proactive agent wake — agents activate on schedule, process queued messages, and execute tasks autonomously without human initiation.
- Implemented inter-agent messaging with a hybrid queue/file architecture (SQLite index + markdown content) supporting synchronous invocation, asynchronous messaging, and urgent wake patterns.
- Orchestrated complex multi-agent productions including a 19-chapter, 33K-word book produced overnight through 19 sequential agent invocations across 7 agents with zero failures.
- Proved substrate-agnostic design: the same CORA structure runs identically on Claude and Gemini, validating that intelligence is encoded in the architecture, not the model.

**Technical Stack**
- Markdown-native knowledge architecture with YAML frontmatter contracts
- Claude Code (primary runtime), macOS launchd (scheduling), Bash/PowerShell automation
- SQLite message queuing, Git version control, ElevenLabs voice synthesis
- Context compression, semantic search with embeddings, session compaction handling

**Impact**
- Demonstrated that human-AI collaboration can operate as genuine partnership — distributed cognition where human memory and judgment combine with AI processing and pattern recognition.
- Established reusable patterns for agent identity, memory persistence, and multi-agent orchestration that are model-agnostic and framework-independent.
