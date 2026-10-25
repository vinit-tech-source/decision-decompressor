import { Card, validate } from '../shared/validator.ts';
import { pickFallback } from '../shared/fallback.ts';
import { SYSTEM, userPrompt, TOO_MUCH_SUFFIX, retrySuffix } from '../shared/prompts.ts';
import { extractJson } from '../shared/json.ts';

export interface LocalGenerationResult {
  card: Card;
  source: 'model' | 'fallback';
  attempts: number;
  model: string;
  latencyMs: number;
  note?: string;
  ollamaError?: string;
}

export async function executeLocalOllama(
  dump: string,
  ollamaUrl: string,
  model: string,
  tooMuch: boolean = false,
  context?: string
): Promise<LocalGenerationResult> {
  const startTime = Date.now();
  let attempts = 0;
  let lastReason = "unknown error";
  const normalizedUrl = (ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
  const chatEndpoint = `${normalizedUrl}/api/chat`;

  for (let i = 1; i <= 2; i++) {
    attempts = i;
    let prompt = userPrompt(dump, context);
    if (tooMuch) {
      prompt += "\n\n" + TOO_MUCH_SUFFIX;
    }
    if (i === 2) {
      prompt += "\n\n" + retrySuffix(lastReason);
    }

    try {
      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          format: 'json',
          options: { temperature: 0.7, num_predict: 160 },
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: prompt }
          ]
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data?.message?.content;
      const jsonRes = extractJson(content);
      if (!jsonRes.ok) {
        lastReason = jsonRes.reason;
        continue;
      }

      const valRes = validate(jsonRes.data);
      if (valRes.ok) {
        return {
          card: jsonRes.data as Card,
          source: 'model',
          attempts,
          model,
          latencyMs: Date.now() - startTime
        };
      } else {
        lastReason = valRes.reason;
      }
    } catch (err: any) {
      lastReason = err?.message || 'Network error';
      // If first attempt network-failed completely, check if Ollama is unreachable
      if (i === 1 && (lastReason.includes('Failed to fetch') || lastReason.includes('Network') || lastReason.includes('timeout'))) {
        const origin = window.location.origin;
        return {
          card: pickFallback(),
          source: 'fallback',
          attempts: 1,
          model,
          latencyMs: Date.now() - startTime,
          note: 'Offered gently, without the model.',
          ollamaError: `Still can't reach Ollama. Make sure it's running and allows this page: OLLAMA_ORIGINS="${origin}" ollama serve then: ollama pull ${model}. Or run Still locally with npm run dev. Or switch to Hosted mode.`
        };
      }
    }
  }

  return {
    card: pickFallback(),
    source: 'fallback',
    attempts,
    model,
    latencyMs: Date.now() - startTime,
    note: 'Offered gently, without the model.'
  };
}
