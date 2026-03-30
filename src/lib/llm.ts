/**
 * Provider-agnostic LLM adapter layer.
 * Implements: OpenAIAdapter, AnthropicAdapter, OllamaAdapter (OpenAI-compatible).
 */

export interface LLMAdapter {
  generate(params: {
    systemPrompt: string;
    userPrompt: string;
    model: string;
    maxTokens: number;
    responseFormat?: 'json';
  }): Promise<string>;
}

export type LLMProvider = 'openai' | 'anthropic' | 'ollama';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string; // for Ollama / custom endpoint
  model?: string;
}

function normalizeOpenAICompatibleBaseUrl(baseUrl?: string): string {
  const fallback = 'http://localhost:11434/v1';
  const raw = baseUrl?.trim();
  if (!raw) return fallback;

  // OpenAI-compatible local servers usually expose /v1; add it when missing.
  const withoutTrailingSlash = raw.replace(/\/+$/, '');
  if (/\/v1$/i.test(withoutTrailingSlash)) return withoutTrailingSlash;
  return `${withoutTrailingSlash}/v1`;
}

function extractOpenAITextContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  const textParts = content
    .map((part) => {
      if (!part || typeof part !== 'object') return '';
      const maybeText = (part as { text?: unknown }).text;
      return typeof maybeText === 'string' ? maybeText : '';
    })
    .filter(Boolean);

  return textParts.join('\n').trim();
}

/** OpenAI Chat Completions now reject `json_object`; use structured outputs (`json_schema`) instead. */
const OPENAI_INTERVIEW_QUESTIONS_RESPONSE_FORMAT = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'interview_questions',
    description: 'Generated interview questions with ideal answers',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              difficulty: { type: 'string', enum: ['foundational', 'intermediate', 'advanced'] },
              ideal_answer: {
                type: 'object',
                properties: {
                  core_concept: { type: 'string' },
                  interview_framing: { type: 'string' },
                  key_points: { type: 'array', items: { type: 'string' } },
                  follow_up_questions: { type: 'array', items: { type: 'string' } },
                },
                required: ['core_concept', 'interview_framing', 'key_points', 'follow_up_questions'],
                additionalProperties: false,
              },
              tags: { type: 'array', items: { type: 'string' } },
            },
            required: ['question', 'difficulty', 'ideal_answer', 'tags'],
            additionalProperties: false,
          },
        },
      },
      required: ['questions'],
      additionalProperties: false,
    },
  },
};

function normalizeJsonGenerationToQuestionsArray(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const candidates: string[] = [trimmed];

  // Common failure mode from models: wrapping valid JSON in markdown code fences.
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fencedMatch?.[1]) {
    candidates.push(fencedMatch[1].trim());
  }

  // If there is extra text around JSON, try slicing from first object/array token.
  const firstBrace = trimmed.indexOf('{');
  const firstBracket = trimmed.indexOf('[');
  const starts = [firstBrace, firstBracket].filter((idx) => idx >= 0);
  if (starts.length > 0) {
    const start = Math.min(...starts);
    candidates.push(trimmed.slice(start).trim());
  }

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        Array.isArray((parsed as { questions?: unknown }).questions)
      ) {
        return JSON.stringify((parsed as { questions: unknown[] }).questions);
      }
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed);
      }
    } catch {
      // Try next candidate variant.
    }
  }

  try {
    // Preserve prior behavior of returning raw when parse cannot be normalized.
    JSON.parse(trimmed);
  } catch {
    /* caller may parse; return raw */
  }
  return text;
}

class OpenAIAdapter implements LLMAdapter {
  constructor(private config: LLMConfig) {}

  async generate({ systemPrompt, userPrompt, model, maxTokens, responseFormat }: Parameters<LLMAdapter['generate']>[0]): Promise<string> {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: this.config.apiKey });
    const response = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      response_format: responseFormat === 'json' ? OPENAI_INTERVIEW_QUESTIONS_RESPONSE_FORMAT : undefined,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    const text = extractOpenAITextContent(response.choices[0]?.message?.content);
    return responseFormat === 'json' ? normalizeJsonGenerationToQuestionsArray(text) : text;
  }
}

class AnthropicAdapter implements LLMAdapter {
  constructor(private config: LLMConfig) {}

  async generate({ systemPrompt, userPrompt, model, maxTokens }: Parameters<LLMAdapter['generate']>[0]): Promise<string> {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: this.config.apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    const block = response.content[0];
    return block.type === 'text' ? block.text : '';
  }
}

class OllamaAdapter implements LLMAdapter {
  constructor(private config: LLMConfig) {}

  async generate({ systemPrompt, userPrompt, model, maxTokens, responseFormat }: Parameters<LLMAdapter['generate']>[0]): Promise<string> {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({
      apiKey: this.config.apiKey || 'ollama',
      baseURL: normalizeOpenAICompatibleBaseUrl(this.config.baseUrl),
    });
    // LM Studio and other OpenAI-compatible locals often reject `json_object` (same 400 as
    // api.openai.com: only `json_schema` or `text`). We use plain text + prompts and normalize below.
    const response = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      response_format: responseFormat === 'json' ? { type: 'text' } : undefined,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    const text = extractOpenAITextContent(response.choices[0]?.message?.content);
    return responseFormat === 'json' ? normalizeJsonGenerationToQuestionsArray(text) : text;
  }
}

export function createAdapter(config: LLMConfig): LLMAdapter {
  switch (config.provider) {
    case 'openai':
      return new OpenAIAdapter(config);
    case 'anthropic':
      return new AnthropicAdapter(config);
    case 'ollama':
      return new OllamaAdapter(config);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

export const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-opus-4-6',
  ollama: 'llama3.2',
};

export const GENERATION_SYSTEM_PROMPT = `You are an expert in generative AI and large language model (LLM) engineering.
Your task is to generate realistic, high-quality interview questions and ideal answers for Gen AI developer roles.

Each question must be:
- Realistic (based on what Gen AI engineers actually ask in interviews at top AI companies)
- Specific (tied to real tools, frameworks, and production concepts — not vague)
- Calibrated to the requested difficulty level
- Paired with an ideal answer that would impress a senior interviewer

Return ONLY a JSON object with a single property "questions" whose value is an array. No markdown or extra text. Each array item must follow this exact schema:
{
  "question": "string",
  "difficulty": "foundational" | "intermediate" | "advanced",
  "ideal_answer": {
    "core_concept": "1-2 sentence definition of the core concept",
    "interview_framing": "How to frame this for an interview — connect to production realities",
    "key_points": ["point 1", "point 2", "point 3", "..."],
    "follow_up_questions": ["follow up 1", "follow up 2"]
  },
  "tags": ["tag1", "tag2"]
}`;
