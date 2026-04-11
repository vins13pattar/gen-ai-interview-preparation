# Gen AI Interview Prep

**A free, open-source, self-hosted tool for Gen AI developer interview preparation.**

Browse 500+ realistic interview questions across 8 Gen AI domains, each paired with a curated ideal answer — the kind of answer that would impress a senior interviewer. No timers, no scores, no pressure.

**Bring Your Own Key (BYOK):** Supply your own OpenAI, Anthropic, or Ollama API key. Keys are encrypted with AES-256 and stored locally — never sent anywhere except your configured LLM provider.

## Domains Covered

- LLM Internals (transformers, attention, KV cache, quantization, speculative decoding)
- Retrieval-Augmented Generation (vector DBs, chunking, reranking, RAGAS evaluation)
- Fine-tuning & Alignment (LoRA, QLoRA, RLHF, DPO, dataset curation)
- Prompt Engineering (CoT, structured output, adversarial prompting)
- Agentic Systems & Tool Use (MCP, ReAct, multi-agent, memory architectures)
- MLOps for LLMs (vLLM, TGI, observability, cost optimization)
- AI Safety & Ethics (hallucination mitigation, red-teaming, EU AI Act)
- Behavioral & Situational (STAR method, trade-off reasoning, production incidents)

## Quick Start (< 5 minutes)

### Prerequisites

- Node.js 18+ or Bun
- pnpm (`npm install -g pnpm`)
- An API key from OpenAI, Anthropic, or a local Ollama instance

### 1. Clone and install

```bash
git clone https://github.com/your-org/gen-ai-interview-prep.git
cd gen-ai-interview-prep
pnpm install
```

### 2. Set up the database and seed questions

```bash
cp .env.example .env
pnpm run setup
```

This creates a local SQLite database and seeds it with 500+ questions. No API key needed for this step.

### 3. Start the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). On first launch you'll be prompted to add your API key.

### Provider Setup

**OpenAI:**
- Get a key at platform.openai.com
- Select "OpenAI (GPT-4o)" in the setup screen
- Paste your `sk-...` key

**Anthropic:**
- Get a key at console.anthropic.com
- Select "Anthropic (Claude)" in the setup screen
- Paste your `sk-ant-...` key

**Ollama (local, free):**
- Install Ollama: `curl -fsSL https://ollama.ai/install.sh | sh`
- Pull a model: `ollama pull llama3.2`
- Select "Ollama / Custom" in setup — no API key needed

**LM Studio (OpenAI-compatible local server):**
- In LM Studio, start the local server and copy the server URL (for example `http://192.168.1.5:1234`).
- In setup/settings, choose "Ollama / Custom endpoint".
- Set **Model** to the LM Studio model id (for example `qwen/qwen3.5-9b`).
- Set **Base URL** to the LM Studio server URL. The app auto-appends `/v1` when missing.
- API key is optional for local servers; a placeholder key is used if omitted.

## Features

- **Browse by domain** with difficulty filter (Foundational / Intermediate / Advanced)
- **Expand any question** to see the full ideal answer with core concept, interview framing, key points, and follow-up questions
- **Bookmark questions** as "Studied" or "Needs Review"
- **Full-text search** across all questions and answers
- **Random Question mode** per domain for quick 10-minute reviews
- **Add more questions (AI)** per domain using your API key — new questions are appended to the bank, never replacing existing ones
- **JSON export** of the full question bank for contributor workflows

## Security

- API keys are encrypted with AES-256-GCM using a randomly generated local key stored in `.keyfile`
- The `.keyfile` and database (`local.db`) are gitignored and never committed
- No telemetry, no analytics, no external requests except user-initiated LLM calls
- **Network deployments:** If the app is reachable beyond your machine, set **`APP_ACCESS_PASSWORD`** in the environment. Users must sign in at `/login`; the session is an **httpOnly** signed cookie (no bearer token in the browser bundle). Optionally set **`APP_SESSION_SECRET`** to a long random string so session verification avoids a slow key derivation on every request. Failed login attempts are **rate-limited in memory** per client IP (trust `X-Forwarded-For` only from your proxy). For maximum isolation, put the app behind a reverse proxy with SSO or Basic Auth instead.

## Contributing

Question contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add questions via JSON or submit a PR.

To export the current question bank:
```bash
# Via the UI: Domains page → Export JSON
# Or directly:
curl http://localhost:3000/api/export > questions-export.json
```

## License

MIT — free to use, modify, and distribute.
