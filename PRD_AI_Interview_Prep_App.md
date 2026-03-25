# Product Requirements Document
## AI-Assisted Interview Preparation App for Generative AI Developers

**Document Status:** Draft
**Version:** 2.0
**Author:** Product Team
**Date:** March 25, 2026
**Distribution:** Open Source — Public
**Stakeholders:** Engineering, DevRel, Community Contributors

> **v2.0 Change Summary:** Repositioned as a fully open-source, free, self-hosted tool. Monetization removed. BYOK (Bring Your Own Key) model adopted with encrypted key storage. Core product experience revised from quiz/scoring to realistic interview questions + ideal answers per Gen AI topic. All open questions from v1.0 resolved and closed.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Product Philosophy](#2-product-philosophy)
3. [Goals](#3-goals)
4. [Non-Goals](#4-non-goals)
5. [Target Users & Personas](#5-target-users--personas)
6. [User Stories](#6-user-stories)
7. [Requirements](#7-requirements)
8. [Feature Breakdown](#8-feature-breakdown)
9. [Success Metrics](#9-success-metrics)
10. [Acceptance Criteria](#10-acceptance-criteria)
11. [Technical Considerations](#11-technical-considerations)
12. [Resolved Decisions](#12-resolved-decisions)
13. [Timeline Considerations](#13-timeline-considerations)
14. [Appendix](#14-appendix)

---

## 1. Problem Statement

Generative AI is one of the fastest-moving fields in tech, yet candidates interviewing for Gen AI developer roles — spanning LLM engineering, RAG architecture, fine-tuning, prompt engineering, and AI product development — face a fragmented and outdated preparation landscape. Existing interview prep tools (LeetCode, Pramp, Interviewing.io) are optimized for traditional software engineering and offer little to no coverage of Gen AI-specific competencies such as model evaluation, vector databases, AI safety, or multi-modal system design.

Candidates who want to prepare for real Gen AI interviews today must either piece together scattered blog posts and papers, or use general-purpose chat tools (ChatGPT, Claude) without any structure, domain taxonomy, or curated ideal-answer framing. There is no free, open-source, self-hostable tool purpose-built to help a developer study what they would actually be asked in a Gen AI interview — and exactly what a strong answer looks like.

With Gen AI developer roles growing at 3x the rate of general SWE roles (2025 data), this gap represents significant lost opportunity for the developer community, and the absence of a free, high-quality open-source solution means well-qualified candidates remain underprepared.

---

## 2. Product Philosophy

This app is built on three core principles that must be preserved across all design and engineering decisions:

**Open by Default.** The app is fully open-source, free to use, and free to self-host. There are no paywalls, no subscriptions, no premium tiers. Contributions from the community are welcome and the question bank can grow alongside the field.

**Bring Your Own Key (BYOK).** The app does not proxy LLM API calls through a central service. Users supply their own API key (OpenAI, Anthropic, Gemini, or any compatible provider). API keys are stored encrypted locally. This means zero API cost to the project and full user control over their data and model choice.

**Questions + Ideal Answers, Not Quizzes.** The core experience is studying realistic interview questions and understanding what an ideal answer looks like — not submitting answers for scoring or judgment. The app respects that interview prep is about internalizing knowledge, not passing automated tests. There is no answer submission, no scoring, no pass/fail.

---

## 3. Goals

**G1 — Comprehensive Domain Coverage:** Users can browse realistic interview questions across all major Gen AI interview domains (LLM internals, RAG, fine-tuning, prompt engineering, agentic systems, MLOps, AI safety/ethics, behavioral), with at least 500 questions at launch covering 8+ topic areas.

**G2 — Ideal Answer Clarity:** Every question in the bank is paired with a concise, practical ideal answer — the kind of answer that would impress a senior interviewer — so users know not just the topic but exactly how to articulate it under interview conditions.

**G3 — Freshness & Regeneration:** The question bank remains current with the fast-moving Gen AI landscape. Users (or contributors) can trigger AI-powered regeneration of the question bank for any topic, with new questions generated via their own API key and persisted to the local DB.

**G4 — Zero-Friction Setup:** A developer can clone the repo, add their API key, and be studying real Gen AI interview questions within 5 minutes. No account creation, no cloud dependency, no billing setup.

**G5 — Trustworthy BYOK Security:** API keys provided by users are encrypted at rest using a strong, locally-managed encryption key. Keys are never logged, never sent to any third-party service, and never stored in plaintext.

**G6 — Community Extensibility:** The question bank schema, generation prompts, and topic taxonomy are all open and well-documented so contributors can add new domains, improve existing questions, and submit pull requests.

---

## 4. Non-Goals

- **Quiz or scoring functionality:** The app will not accept user-submitted answers for evaluation, scoring, or grading. This is a study reference tool, not an automated judge. Users study the questions and ideal answers at their own pace.

- **Voice or audio modes:** No speech-to-text, text-to-speech, or audio-based interview simulation. Text-only experience in v1.

- **Coding execution environments:** No runnable code cells, REPLs, or sandboxed code execution. Code-adjacent questions (e.g., "sketch a retrieval pipeline") are text-based only.

- **User accounts or cloud sync:** No sign-up, no login, no cloud-hosted user data. The app is designed to run locally. Session state, bookmarks, and settings are stored locally in the DB.

- **Centralized API proxy or hosted version:** The project will not operate a shared LLM API endpoint. Every user is responsible for their own API key and usage costs. A hosted demo may be considered post-v1 with explicit opt-in.

- **Enterprise or team features:** No multi-user dashboards, cohort management, or admin roles in v1.

- **Monetization of any kind:** No ads, no paid tiers, no donation prompts within the app. This is a community tool.

- **Non-English content at launch:** English-only question bank in v1. Internationalization infrastructure will be considered in v2 based on contributor interest.

- **Job board or ATS integration:** Focused entirely on preparation, not placement.

---

## 5. Target Users & Personas

### Persona 1 — "The Career Switcher" (Alex)
- Background: 3–5 years in traditional SWE (backend, data engineering); learning Gen AI on the side
- Goal: Break into Gen AI roles at mid-to-large tech companies within the next 6 months
- Pain: Knows Python and APIs but lacks fluency in LLM-specific concepts (attention mechanisms, RLHF, vector stores); doesn't know what a strong interview answer sounds like in this domain
- Behavior: Studies evenings/weekends; prefers structured browsing by topic; wants to see exactly what a good answer looks like so they can adapt it to their own experience
- BYOK comfort: Comfortable setting up an API key; likely uses OpenAI or Anthropic already for side projects

### Persona 2 — "The ML Researcher Entering Industry" (Priya)
- Background: PhD or research background in ML/NLP, preparing for first industry interview
- Goal: Translate deep theoretical knowledge into the applied, articulate answers that industry interviewers expect
- Pain: Knows the math but struggles to frame answers for an engineering audience; unfamiliar with production-focused questions (latency, cost, MLOps)
- Behavior: Prefers depth; will read multiple questions per topic carefully; wants ideal answers to include practical production considerations, not just theory
- BYOK comfort: Very comfortable; may even want to swap in a local model (Ollama) instead of a paid API

### Persona 3 — "The Experienced Gen AI Developer" (Marcus)
- Background: 2+ years in LLM engineering; now targeting senior/staff roles at top AI labs
- Goal: Sharpen articulation of advanced topics; fill edge-case gaps; prepare for bar-raiser-level questions
- Pain: Knows the material but hasn't practiced stating it cleanly under pressure; may have blind spots on newer topics (DPO, MCP, multimodal systems)
- Behavior: Uses the app for targeted topic review rather than end-to-end study; will regenerate question bank for niche topics; likely to contribute improvements back to the repo
- BYOK comfort: Power user; may configure multiple API providers; comfortable customizing prompts

---

## 6. User Stories

Listed in priority order.

### BYOK Setup & Onboarding

**US-01** — As a new user, I want to enter my LLM API key (OpenAI / Anthropic / Gemini / custom endpoint) during first launch so that the app can generate ideal answers using my own account.

**US-02** — As a user, I want my API key to be encrypted and stored locally so that it is never exposed in logs, config files, or any external service.

**US-03** — As a user, I want to be able to update or rotate my API key at any time from the settings panel so that I can switch providers without needing to reconfigure the entire app.

**US-04** — As a developer self-hosting the app, I want clear setup documentation (README) that gets me from `git clone` to studying questions in under 5 minutes so that the barrier to entry is as low as possible.

### Browsing Questions by Topic

**US-05** — As a candidate, I want to browse interview questions organized by Gen AI domain (e.g., RAG, Fine-tuning, LLM Internals) so that I can focus my study on the areas most relevant to my upcoming interview.

**US-06** — As a candidate, I want to filter questions by difficulty level (Foundational / Intermediate / Advanced) so that I can match the depth of preparation to the seniority of the role I'm targeting.

**US-07** — As a candidate, I want to see the ideal answer for each question — the kind of answer that would genuinely impress a senior interviewer — immediately below the question so that I can study and internalize the key points.

**US-08** — As a candidate, I want to mark questions as "studied" or "needs review" so that I can track which areas I've covered without the app scoring me.

**US-09** — As a candidate, I want to search across the question bank by keyword (e.g., "KV cache", "reranking", "RLHF") so that I can quickly find questions relevant to specific concepts I'm unsure about.

### Ideal Answers

**US-10** — As a candidate, I want each ideal answer to include the core concept, a practical framing for an interview context, and key points an interviewer would listen for so that I know exactly what to say and why.

**US-11** — As a candidate, I want ideal answers to indicate common follow-up questions that interviewers tend to ask after this question so that I can prepare for the conversation going deeper.

**US-12** — As a candidate, I want ideal answers to be concise enough to be delivered in 2–4 minutes verbally so that they are realistic for an actual interview, not textbook essays.

### Question Bank Management & Regeneration

**US-13** — As a user, I want to trigger regeneration of the question bank for a specific topic (e.g., "Agentic Systems") using my API key so that I can refresh questions as the field evolves.

**US-14** — As a user, when I regenerate a topic's question bank, I want new questions to be appended (not replace existing ones) unless I explicitly choose to replace so that I don't lose curated content.

**US-15** — As a contributor, I want to export the full question bank as a JSON file so that I can review, edit, and submit improvements back to the open-source repository via pull request.

**US-16** — As a user, I want to see the "last generated" date for each topic's question bank so that I know how recent the questions are and whether regeneration would be valuable.

### Navigation & Experience

**US-17** — As a candidate in a hurry, I want a "Random Question" mode per topic that surfaces one question at a time so that I can do a quick 10-minute review without committing to a full topic browse.

**US-18** — As a candidate, I want a clean, distraction-free reading experience (no timers, no scores, no progress bars) so that I can focus on understanding the content rather than racing through it.

---

## 7. Requirements

### Must-Have — P0 (Launch Blockers)

| ID | Requirement | Notes |
|----|-------------|-------|
| R01 | BYOK API key input, encrypted storage, and validation on setup | Keys encrypted with AES-256 using a locally-generated encryption key stored separately from the key value |
| R02 | Support for at least 3 LLM providers: OpenAI (GPT-4o), Anthropic (Claude), and a custom base URL (Ollama-compatible) | Provider-agnostic adapter layer; new providers addable via config |
| R03 | Gen AI question bank with minimum 500 questions across 8 domains, pre-seeded in the local DB at install | Questions seeded from the repo's `seed/` directory; no API call needed to start studying |
| R04 | Each question paired with a complete ideal answer (2–4 min verbal delivery equivalent) | Ideal answers must include: core concept, interview framing, key points to hit, 1–2 common follow-up questions |
| R05 | Browse questions by domain with difficulty filter (Foundational / Intermediate / Advanced) | 8 domains at launch (see Appendix A for taxonomy) |
| R06 | Full-text search across questions and answers | <500ms response; supports partial match and keyword search |
| R07 | "Studied" / "Needs Review" bookmark state per question, persisted in local DB | No account needed; state stored locally |
| R08 | AI-powered question bank regeneration per topic, using user's configured API key | New questions and ideal answers generated via LLM call; appended to DB by default |
| R09 | "Last generated" timestamp displayed per topic | Helps users decide when to refresh |
| R10 | JSON export of full question bank | For contributor workflow and backup |
| R11 | "Random Question" mode per domain | One question at a time; cycles through unread questions first |
| R12 | Clean README with setup instructions: clone → configure API key → run → study in <5 min | Must include instructions for OpenAI, Anthropic, and Ollama setups |

### Nice-to-Have — P1 (High-Priority Fast Follows)

| ID | Requirement | Notes |
|----|-------------|-------|
| R13 | Spaced repetition queue based on "Needs Review" bookmarks | Resurfaces marked questions on an increasing interval |
| R14 | Topic-level study progress view (X of Y questions studied per domain) | Motivational; no scoring involved |
| R15 | Dark mode | Developer audience strongly prefers it |
| R16 | Community question submission flow (submit via GitHub issue template) | Structured form generating a pre-filled GitHub issue for maintainer review |
| R17 | Configurable question bank generation prompt (advanced users can tune the LLM prompt) | Enables expert customization; stored as a user-editable config file |
| R18 | Import question bank from JSON (for applying community-contributed packs) | Reverse of R10; enables ecosystem of question packs |

### Future Considerations — P2 (Architectural Awareness)

| ID | Requirement | Notes |
|----|-------------|-------|
| R19 | Hosted web demo with ephemeral API key input (key not stored, used per-session only) | Lowers barrier for non-technical users to try before cloning |
| R20 | Localization / multi-language question bank | Based on community contributor interest; English-first architecture must not block this |
| R21 | Pluggable domain packs (community-published topic extensions) | Plugin/extension model for question bank; needs schema stability first |
| R22 | CLI mode for terminal-native users | `npx genai-interview next --topic rag` style interface |

---

## 8. Feature Breakdown

### 8.1 BYOK Configuration & API Key Security

The BYOK system is both a core feature and a trust foundation for the app. Users must feel confident their API keys are safe.

**Setup Flow:**
1. On first launch, user is shown the API key configuration screen
2. User selects provider (OpenAI / Anthropic / Gemini / Custom)
3. User enters API key; app immediately validates it with a lightweight test call
4. On successful validation, key is encrypted with AES-256 using a randomly generated local encryption key stored in a separate `.keyfile` (excluded from version control via `.gitignore`)
5. Encrypted key value is stored in the local DB; plaintext key is never written to disk
6. App displays confirmation: "Key stored securely. You can update it anytime in Settings."

**Security Rules:**
- API key is decrypted in memory only when an LLM call is needed; it is not held in memory between calls
- The `.keyfile` and DB file paths are user-configurable for users who want to separate them onto encrypted volumes
- No telemetry, no analytics, no external pings. The app is entirely local unless making an LLM API call initiated by the user

**Provider Adapter Layer:**
The LLM integration must use a provider-agnostic adapter so that swapping providers requires only a config change, not a code change. The adapter interface exposes: `generate(prompt, model, maxTokens) → text`.

### 8.2 Gen AI Question Bank

The question bank is the product's content core. It ships pre-seeded with 500+ questions and ideal answers, and grows over time through AI regeneration and community contribution.

**Domain Taxonomy (8 domains at launch):**
- LLM Internals (transformers, attention, tokenization, KV cache, context windows, quantization, speculative decoding)
- Retrieval-Augmented Generation (RAG pipelines, embedding models, vector DBs, chunking, hybrid search, reranking, evaluation)
- Fine-tuning & Alignment (LoRA, QLoRA, PEFT, SFT, RLHF, DPO, dataset curation, catastrophic forgetting)
- Prompt Engineering (few-shot, chain-of-thought, self-consistency, structured output, adversarial prompting)
- Agentic Systems & Tool Use (function calling, MCP, ReAct, Plan-and-Execute, multi-agent orchestration, memory types)
- MLOps for LLMs (model serving — vLLM/TGI/Triton, latency/throughput trade-offs, cost optimization, observability — LangSmith/Langfuse)
- AI Safety & Ethics (hallucination mitigation, red-teaming, bias auditing, responsible AI frameworks, EU AI Act)
- Behavioral & Situational (STAR method, project trade-off discussions, cross-functional collaboration, technical communication)

**Question Schema (stored in DB):**
```json
{
  "id": "uuid",
  "domain": "rag",
  "difficulty": "intermediate",
  "question": "Explain the difference between dense and hybrid retrieval in a RAG pipeline.",
  "ideal_answer": {
    "core_concept": "...",
    "interview_framing": "...",
    "key_points": ["...", "..."],
    "follow_up_questions": ["...", "..."]
  },
  "tags": ["retrieval", "embeddings", "BM25"],
  "generated_at": "2026-03-25T00:00:00Z",
  "source": "seed_v1 | generated | community"
}
```

**Question Types (represented across the bank):**
- Conceptual / definitional — "Explain how KV caching works and why it matters for inference"
- Applied / scenario-based — "Your RAG system is returning irrelevant results for multi-hop questions. How do you debug this?"
- System design — "Design a document Q&A system for a legal firm with 10M documents. Walk me through your architecture."
- Trade-off / opinion — "When would you choose fine-tuning over RAG, and what factors drive that decision?"

**Ideal Answer Structure:**
Each ideal answer is crafted to give candidates the precise framing and talking points that experienced interviewers look for — not academic essays, but punchy, articulate, production-aware explanations.

A well-formed ideal answer includes:
- A 1–2 sentence core concept definition (the "what")
- A practical interview framing that connects to production realities (the "so what")
- 3–5 key points the candidate should hit to demonstrate depth
- 1–2 natural follow-up questions an interviewer would likely ask next (helps candidates prepare the second layer)

### 8.3 Question Bank Regeneration

The regeneration system allows users to keep the question bank current as the Gen AI landscape evolves, using their own API key to generate new content.

**Regeneration Flow:**
1. User navigates to a domain (e.g., "Agentic Systems") and clicks "Regenerate Questions"
2. App shows current question count, last generated date, and an estimated API cost (token estimate)
3. User confirms; app sends generation prompt to configured LLM provider
4. LLM generates N new question-answer pairs (default: 20 per regeneration run) in the defined JSON schema
5. App validates schema compliance, deduplicates against existing questions, and appends new entries to DB
6. User sees a success summary: "18 new questions added. 2 duplicates skipped."

**Generation Prompt Design:**
The system prompt is versioned and stored in the repo. It instructs the LLM to generate questions that are:
- Realistic (based on what Gen AI engineers actually ask in interviews)
- Specific (not vague; tied to real tools, frameworks, and concepts)
- Calibrated to the requested difficulty level
- Paired with ideal answers following the defined structure

The generation prompt is user-editable via a config file for advanced users who want to tune style, depth, or focus area (e.g., "focus on questions about multimodal LLMs").

### 8.4 Browse & Study Experience

The study interface is intentionally minimal — no timers, no scores, no pressure. The goal is a clean reading and learning environment.

**Domain Home Page:**
- List of all 8 domains with question count, last regenerated date, and quick-filter by difficulty
- Topic-level bookmark summary (X studied, Y needs review)

**Question Browser:**
- Questions displayed as a card list within a domain; filterable by difficulty and bookmark state
- Clicking a question expands the ideal answer inline (or navigates to a dedicated question detail view)
- Keyboard shortcuts for power users: Next (→), Mark Studied (S), Mark Needs Review (R), Random (Space)

**Question Detail View:**
- Question text prominently displayed
- Ideal answer rendered below, structured into sections (Core Concept / Interview Framing / Key Points / Follow-up Questions)
- "Mark as Studied" / "Needs Review" toggle
- "Related Questions" sidebar showing 2–3 questions from the same domain with overlapping tags

**Random Question Mode:**
- Available per domain; serves one question at a time
- Prioritizes "Needs Review" bookmarked questions, then unread, then all
- Simple "Next Question" button — no timer, no session tracking

---

## 9. Success Metrics

Since this is an open-source community tool with no telemetry, traditional product analytics do not apply. Success is measured through community signals and qualitative indicators.

### Community Health Metrics (observable on GitHub)

| Metric | 30-day target | 90-day target |
|--------|---------------|---------------|
| GitHub stars | 200 | 1,000 |
| Forks | 50 | 300 |
| Pull requests (question contributions) | 5 | 30 |
| Issues opened (bug reports + feature requests) | Active discussion | Active discussion |
| README "Set up in <5 min" self-reported success | Positive first-issue feedback | Positive first-issue feedback |

### Quality Indicators (measurable without telemetry)

- Ideal answers pass a manual review: a senior Gen AI developer (3+ YOE) judges ≥90% of answers as "would satisfy me in an interview"
- Question bank covers ≥90% of topics mentioned in 50 publicly available Gen AI job descriptions (manual audit)
- Regeneration produces schema-valid output with <5% duplicate rate on a test run

### Adoption Indicators (observable without telemetry)

- Mentions and shares on developer communities (X/Twitter, LinkedIn, r/MachineLearning, Hacker News)
- Blog posts, YouTube walkthroughs, or tutorial videos created by third parties
- Third-party question pack contributions (JSON imports)

---

## 10. Acceptance Criteria

### BYOK Setup

- Given a user launches the app for the first time, when no API key is configured, then they are shown the key configuration screen before accessing any question content.
- Given a user enters an API key, when the app validates it, then it makes a minimal test call (e.g., single token completion) and displays "Key valid" or a specific error message (invalid key, quota exceeded, network error) within 5 seconds.
- Given a user's API key is stored, when they close and reopen the app, then the key is retrieved and decrypted correctly without re-entry.
- Given a user rotates their API key in Settings, when they save the new key, then the old encrypted value is overwritten and the new key is validated before confirming.
- The API key must never appear in: application logs, error messages, exported data files, or network requests other than directly to the configured LLM provider.

### Browsing & Filtering

- Given a user selects a domain, when the question list loads, then all questions for that domain are displayed within 1 second from local DB.
- Given a user applies a difficulty filter (e.g., "Advanced"), when the filter is active, then only questions tagged "advanced" are shown and the count updates immediately.
- Given a user searches for a keyword (e.g., "chunking"), when results are returned, then all questions and answers containing that keyword are surfaced within 500ms.

### Question & Ideal Answer Display

- Given a user views a question, when they expand the ideal answer, then it displays all four structured sections: Core Concept, Interview Framing, Key Points (minimum 3), and Follow-up Questions (minimum 1).
- Given a user marks a question as "Studied", when they return to the domain browser, then that question shows the "Studied" badge and is deprioritized in Random Question mode.
- Given a user is in Random Question mode, when they have unread questions remaining, then the next question served must be an unread one (not already studied).

### Question Bank Regeneration

- Given a user initiates regeneration for a domain, when the LLM call completes, then new questions are appended to the DB (not replacing existing ones unless explicitly chosen).
- Given a user triggers regeneration, when the process is complete, then the "Last Generated" timestamp for that domain is updated.
- Given the LLM returns malformed JSON (schema mismatch), when the app attempts to import it, then the bad entries are skipped with an error log and the user sees how many were skipped vs. imported.
- Given a user triggers regeneration and their API key is invalid, when the call fails, then a clear error message is shown directing them to update their API key in Settings.

### JSON Export

- Given a user exports the question bank, when the export completes, then the output is a valid JSON file containing all questions, ideal answers, metadata, and timestamps for every domain.
- Given a contributor imports a community JSON pack, when the import completes, then duplicate questions (matched by question text similarity) are flagged and skipped with a count shown to the user.

### Setup & Performance

- Given a developer clones the repo and follows the README, when they complete setup, then the app is running with the pre-seeded question bank accessible within 5 minutes on a standard developer machine.
- Given a user navigates between any two screens, when the transition completes, then it must take under 300ms for all locally-served views.

---

## 11. Technical Considerations

### Architecture Overview

The app is designed to run entirely on a developer's local machine. There is no central server, no cloud database, and no hosted backend. The stack should be approachable for open-source contributors.

**Recommended Stack:**
- **Frontend:** Next.js (React) — enables both web UI and potential Electron wrapper in future; familiar to most JS/TS developers
- **Local DB:** SQLite via Prisma — zero-config, file-based, fast for read-heavy question browsing; single `.db` file is easy to back up
- **API Key Encryption:** Node.js `crypto` module (AES-256-GCM); encryption key stored in a separate `.keyfile` (gitignored)
- **LLM Provider Adapter:** Unified provider interface wrapping OpenAI SDK, Anthropic SDK, and a generic OpenAI-compatible client (for Ollama, Together AI, etc.)
- **Question Bank Seed:** JSON files in `seed/` directory; imported into SQLite on first run via a seed script

### BYOK & Key Security Implementation

```
┌────────────────────────────────────────────────┐
│              User's Machine                    │
│                                                │
│  .keyfile (AES encryption key, gitignored)     │
│      ↕ used only to encrypt/decrypt           │
│  local.db (SQLite)                             │
│    - questions table                           │
│    - encrypted_api_key (AES-256-GCM)           │
│    - bookmarks table                           │
│                                                │
│  App decrypts key in memory only when needed  │
│  for LLM calls → makes call → forgets key     │
│                                                │
│  No key is ever written to logs or sent        │
│  anywhere except the configured LLM provider  │
└────────────────────────────────────────────────┘
```

### Question Bank DB Schema (simplified)

```sql
CREATE TABLE domains (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  question_count INTEGER DEFAULT 0,
  last_generated_at TIMESTAMP
);

CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  domain_id TEXT REFERENCES domains(id),
  difficulty TEXT CHECK(difficulty IN ('foundational', 'intermediate', 'advanced')),
  question TEXT NOT NULL,
  ideal_answer_core TEXT NOT NULL,
  ideal_answer_framing TEXT NOT NULL,
  ideal_answer_key_points JSON NOT NULL,   -- array of strings
  ideal_answer_followups JSON NOT NULL,    -- array of strings
  tags JSON,                               -- array of strings
  source TEXT,                             -- 'seed' | 'generated' | 'community'
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(question)                         -- deduplication constraint
);

CREATE TABLE bookmarks (
  question_id TEXT REFERENCES questions(id),
  state TEXT CHECK(state IN ('studied', 'needs_review')),
  updated_at TIMESTAMP,
  PRIMARY KEY (question_id)
);
```

### LLM Provider Adapter

```typescript
interface LLMAdapter {
  generate(params: {
    systemPrompt: string;
    userPrompt: string;
    model: string;
    maxTokens: number;
    responseFormat?: 'json';
  }): Promise<string>;
}

// Implemented by: OpenAIAdapter, AnthropicAdapter, OllamaAdapter
```

### Data & Privacy

- No telemetry, analytics, or error reporting calls to external services. The app is fully offline except for user-initiated LLM calls.
- The `.db` file and `.keyfile` are both listed in `.gitignore` so they cannot be accidentally committed.
- A `--reset` CLI flag should allow users to wipe local state (DB and keyfile) cleanly.
- The app must display a clear notice on the key entry screen: "Your API key is encrypted and stored locally on this machine. It is never sent to any service other than the LLM provider you configure."

### Performance

- All question browsing and search must be served from local SQLite — no LLM calls triggered during browsing. LLM calls are made only for question bank regeneration.
- Full-text search implemented via SQLite FTS5 extension for sub-500ms keyword search across 500+ questions.
- Target: screen transitions <300ms; question detail load <100ms.

### Open Source Project Setup

- License: MIT
- Contribution guide: `CONTRIBUTING.md` with instructions for adding questions (JSON format), improving generation prompts, and adding LLM provider adapters
- Issue templates: Bug report, Feature request, Question contribution
- Question contribution template: Structured GitHub issue that captures question text, domain, difficulty, and proposed ideal answer for maintainer review

---

## 12. Resolved Decisions

All open questions from v1.0 have been resolved and are documented here for traceability.

| # | Original Question | Resolution |
|---|------------------|------------|
| OQ-01 | What LLM provider powers the app and what are the cost implications? | **Resolved — BYOK.** Users supply their own API key. Zero API cost to the project. Supports OpenAI, Anthropic, Gemini, and any OpenAI-compatible endpoint (Ollama). |
| OQ-02 | How do we handle questions with no single correct answer (system design, opinion-based)? | **Resolved — Ideal Answers, Not Scoring.** The app does not evaluate user answers. It shows a curated ideal answer — the key points, framing, and follow-ups a candidate should know — for every question including open-ended ones. No rubric, no judgment. |
| OQ-03 | Should the question bank be built in-house or via hybrid curation? | **Resolved — AI-Generated + DB Cached.** Question bank is generated using the user's own API key and persisted to a local SQLite DB. Pre-seeded JSON ships with the repo for zero-API-call first run. Users can regenerate any topic at any time. |
| OQ-04 | What is the monetization model? | **Resolved — None.** The app is fully open-source and free. No subscriptions, no tiers, no payments. BYOK eliminates operating costs. |
| OQ-05 | Do we need human expert review of AI feedback before showing to users? | **Resolved — Not Applicable.** The app shows curated ideal answers (not live AI evaluations of user answers). The pre-seeded question bank is manually reviewed before the initial release. Community PRs go through maintainer review. |
| OQ-06 | How do we keep the question bank current? | **Resolved — On-Demand Regeneration.** Users can trigger AI-powered regeneration of any domain's question bank at any time using their API key. New questions are appended, not overwritten. The regeneration prompt is versioned and user-editable. |
| OQ-07 | Should v1 support coding execution environments? | **Resolved — No.** Text-only. Code-adjacent questions are handled as text (e.g., "sketch a retrieval pipeline in pseudocode"). No runnable code cells in v1. |
| OQ-08 | Will voice mode be gated behind a paid tier? | **Resolved — Not Applicable.** Voice mode is removed from scope entirely. Text-only experience. No paid tiers. |

---

## 13. Timeline Considerations

### Guiding Principle
Since this is an open-source project without a commercial deadline, timeline is driven by quality and contributor availability rather than a revenue target. The goal is a clean, well-documented v1.0 release that invites contribution.

### Phased Delivery

**Phase 1 — Foundation (Weeks 1–6)**
- Project scaffolding: Next.js app, SQLite + Prisma, repo structure, MIT license, CONTRIBUTING.md
- BYOK key configuration screen with AES-256 encryption (R01, R02)
- Pre-seed question bank: 200 questions across 4 domains (LLM Internals, RAG, Fine-tuning, Prompt Engineering) with ideal answers (R03, R04)
- Basic browse UI: domain list → question list → question detail with ideal answer (R05)
- Developer self-test: 5-minute setup from clone validated on macOS, Linux, Windows (R12)

**Phase 2 — Full Content & Core Features (Weeks 7–14)**
- Complete 8-domain question bank (500+ questions) seeded in repo (R03)
- Difficulty filter, full-text search (R05, R06)
- Bookmark system: Studied / Needs Review (R07)
- Question bank regeneration per domain (R08, R09)
- JSON export (R10)
- Random Question mode (R11)
- README finalized with multi-provider setup guides

**Phase 3 — Polish & Community Launch (Weeks 15–20)**
- UX polish: keyboard shortcuts, mobile responsiveness
- GitHub issue templates for question contributions
- Community launch: Hacker News Show HN, r/MachineLearning, DevRel outreach
- Manual quality audit: senior Gen AI developer review of pre-seeded answers

**Phase 4 — v1.1 Community Iteration (Post-launch, ongoing)**
- Dark mode (R15)
- Spaced repetition queue (R13)
- Community question import (R18)
- Additional domain packs based on contributor interest

### Key Dependencies
- Pre-seed question bank must pass manual quality review before Phase 3 community launch
- BYOK encryption implementation must be reviewed by a security-aware contributor before v1.0 tag
- README setup instructions must be validated on at least 3 different OS/environment combinations

---

## 14. Appendix

### A. Gen AI Interview Domain Reference

Topic clusters based on analysis of publicly reported interview experiences (Glassdoor, Blind, LeetCode Discuss, r/MachineLearning) and 50+ Gen AI developer job descriptions (2024–2026):

**LLM Internals:** Transformer architecture, self-attention and multi-head attention, positional encoding, tokenization (BPE, SentencePiece), KV cache, context window management, quantization (INT4/INT8, GGUF), speculative decoding, mixture of experts (MoE)

**RAG Systems:** Embedding models (dense retrieval), vector databases (Pinecone, Weaviate, Qdrant, pgvector, Chroma), chunking strategies and overlap, hybrid search (BM25 + dense), reranking (cross-encoders, Cohere Rerank), RAG evaluation frameworks (RAGAS, TruLens), multi-hop and agentic RAG

**Fine-tuning & Alignment:** Supervised fine-tuning (SFT), PEFT and LoRA/QLoRA, instruction tuning, RLHF, DPO, ORPO, dataset curation and quality filtering, domain adaptation, catastrophic forgetting and continual learning

**Prompt Engineering:** Zero-shot, few-shot, chain-of-thought (CoT), tree-of-thought, self-consistency, structured output (JSON mode, Instructor, Outlines), prompt injection and adversarial prompting, system prompt design

**Agentic Systems & Tool Use:** OpenAI function calling, Model Context Protocol (MCP), ReAct framework, Plan-and-Execute, multi-agent orchestration (LangGraph, AutoGen, CrewAI), agent memory architectures (short-term, long-term, episodic, semantic), tool use reliability and error recovery

**MLOps for LLMs:** Model serving (vLLM, TGI, Triton Inference Server), throughput vs. latency trade-offs (batching, continuous batching), model versioning and rollout strategies, LLM cost optimization, observability and tracing (LangSmith, Langfuse, OpenTelemetry)

**AI Safety & Ethics:** Hallucination types and mitigation strategies, red-teaming and adversarial testing, bias identification and auditing, responsible AI frameworks (Constitutional AI, RLHF alignment), EU AI Act awareness, output filtering and guardrails

**Behavioral & Situational:** STAR method for project retrospectives, technical trade-off reasoning, communicating AI limitations to non-technical stakeholders, cross-functional collaboration (PM, design, data), debugging production AI failures, prioritization under uncertainty

### B. Competitive Landscape

| Tool | Type | Gen AI Coverage | Cost | Key Gap vs. This App |
|------|------|----------------|------|----------------------|
| LeetCode | Web platform | None | Freemium | Zero Gen AI content; coding-only |
| Exponent | Web platform | Partial | Paid | No Gen AI depth; no BYOK; no local |
| IGotAnOffer | Web platform | ML-focused | Paid | Dated content; passive video; no Q&A |
| Pramp / Interviewing.io | Live sessions | None | Paid | Human-only; expensive; no Gen AI |
| ChatGPT / Claude (DIY) | Chat AI | Broad but unstructured | Freemium/Paid | No taxonomy; no ideal answer structure; no persistence |
| **This App** | Open-source, local | Deep, 8 domains | **Free, BYOK** | — |

**Key differentiator:** The only free, open-source, self-hostable tool built specifically for Gen AI interview preparation, with a structured question bank, curated ideal answers, and BYOK LLM integration — with zero cost and zero data lock-in.

### C. Question Bank JSON Seed Format

Community contributors can submit question packs as JSON files following this schema:

```json
[
  {
    "domain": "rag",
    "difficulty": "intermediate",
    "question": "What is the difference between dense and sparse retrieval in a RAG pipeline?",
    "ideal_answer": {
      "core_concept": "Dense retrieval uses embedding similarity (semantic match); sparse retrieval uses keyword overlap (BM25/TF-IDF). Each has different strengths.",
      "interview_framing": "In production, the right answer is almost always hybrid: use sparse for exact matches and keyword queries, dense for semantic and paraphrased queries, then rerank the merged results.",
      "key_points": [
        "Dense retrieval: embedding model encodes query and docs into vectors; cosine similarity match",
        "Sparse retrieval: BM25 or TF-IDF; fast, explainable, great for keyword-heavy domains",
        "Hybrid search: merge both result sets, then apply a reranker (cross-encoder) to re-score",
        "When to use each: sparse for legal/medical with exact terminology; dense for conversational or paraphrased queries"
      ],
      "follow_up_questions": [
        "How would you tune the weight between dense and sparse results in a hybrid setup?",
        "What reranking model would you use and why?"
      ]
    },
    "tags": ["retrieval", "BM25", "embeddings", "hybrid-search", "reranking"]
  }
]
```

### D. Glossary

| Term | Definition |
|------|-----------|
| BYOK | Bring Your Own Key — users supply their own LLM API key; the app uses it on their behalf |
| RAG | Retrieval-Augmented Generation — combining a retrieval system with a generative LLM |
| LoRA | Low-Rank Adaptation — parameter-efficient fine-tuning technique for LLMs |
| RLHF | Reinforcement Learning from Human Feedback — alignment technique using human preference signals |
| DPO | Direct Preference Optimization — alignment alternative to RLHF; simpler, no reward model needed |
| MCP | Model Context Protocol — Anthropic's open standard for LLM tool/context integration |
| AES-256-GCM | Advanced Encryption Standard with 256-bit key in Galois/Counter Mode — encryption used for API key storage |
| FTS5 | Full-Text Search extension for SQLite — enables fast keyword search across text fields |
| P0/P1/P2 | Priority levels: P0 = must ship, P1 = high-priority follow-up, P2 = future consideration |
| Seed | Pre-populated data shipped with the repo to enable zero-API-call first run |

---

*Document last updated: March 25, 2026 — v2.0. This is an open-source project. Contributions welcome.*
