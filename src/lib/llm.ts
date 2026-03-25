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

class OpenAIAdapter implements LLMAdapter {
  constructor(private config: LLMConfig) {}

  async generate({ systemPrompt, userPrompt, model, maxTokens, responseFormat }: Parameters<LLMAdapter['generate']>[0]): Promise<string> {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: this.config.apiKey });
    const response = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      response_format: responseFormat === 'json' ? { type: 'json_object' } : undefined,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    return response.choices[0]?.message?.content ?? '';
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
      baseURL: this.config.baseUrl || 'http://localhost:11434/v1',
    });
    const response = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      response_format: responseFormat === 'json' ? { type: 'json_object' } : undefined,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    return response.choices[0]?.message?.content ?? '';
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

Return ONLY a valid JSON array with no additional text. Each item must follow this exact schema:
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
