import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { validate, Card } from './src/shared/validator.ts';
import { pickFallback } from './src/shared/fallback.ts';
import { needsCare, CARE_MESSAGE } from './src/shared/safety.ts';
import { SYSTEM, userPrompt, TOO_MUCH_SUFFIX, retrySuffix } from './src/shared/prompts.ts';
import { extractJson } from './src/shared/json.ts';
import {
  UserProfile,
  ALLOWED_FOCUS,
  ALLOWED_HELPS,
  ALLOWED_AVOIDS,
  ALLOWED_ENERGY,
  validateAvoidPreferences,
} from './src/shared/preferences.ts';
import {
  checkModelQuota,
  recordModelCall,
  markExternal429,
  getQuotaStatus,
  classifyError,
  BUSY_USER_MESSAGE,
  getDailyLimit,
  getMinuteLimit,
  QuotaStatus,
} from './src/shared/quota.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);
app.use(express.json({ limit: '64kb' }));

type LoggingResponse = Response & { __skipLogging?: boolean };

// Logging: NEVER log request bodies, brain-dump text, or model output.
// Log only method, path, status code, and latency.
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    // If request was a care case on /api/still, safety rule: "if needsCare(dump) is true, do NOT call the model and do NOT log"
    if ((res as LoggingResponse).__skipLogging) {
      return;
    }
    const latency = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${latency}ms`);
  });
  next();
});

// In-memory Rate Limiters (per IP)
interface RateRecord {
  count: number;
  resetAt: number;
}

function createRateLimiter(maxRequests: number, windowMs: number) {
  const clients = new Map<string, RateRecord>();

  return (req: Request, res: Response, next: NextFunction) => {
    // When trust proxy is enabled, req.ip accurately reflects the client's actual IP
    const ip = req.ip || (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const clientRecord = clients.get(ip);

    if (!clientRecord || now > clientRecord.resetAt) {
      clients.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (clientRecord.count >= maxRequests) {
      return res.status(429).json({
        error: BUSY_USER_MESSAGE,
        busy: true,
        reason: "busy",
      });
    }

    clientRecord.count += 1;
    next();
  };
}

const stillLimiter = createRateLimiter(20, 10 * 60 * 1000); // 20 requests per 10 mins
const labLimiter = createRateLimiter(60, 10 * 60 * 1000);   // 60 requests per 10 mins

// GenAI SDK Setup & Environment Variable Validation
const rawApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const isGeminiApiKeySet = Boolean(rawApiKey && rawApiKey !== "MY_GEMINI_API_KEY" && rawApiKey.trim().length > 0);
const apiKey = isGeminiApiKeySet ? rawApiKey!.trim() : "";

if (!isGeminiApiKeySet) {
  console.warn("⚠️  [Still] Warning: GEMINI_API_KEY is not configured or using default placeholder. Hosted requests will fall back to local offline cards.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

const ALLOWED_MODELS = new Set(["gemma-4-31b-it", "gemma-4-26b-a4b-it"]);
const DEFAULT_MODEL = "gemma-4-26b-a4b-it";
const ALLOWED_CONTEXTS = new Set(["Work", "Home", "Rest", "Study"]);

// Helper: Call model with timeout
async function generateWithTimeout(
  model: string,
  config: { systemInstruction?: string; [key: string]: unknown },
  contents: string,
  ms = 40000
): Promise<string> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });

  const callPromise = (async () => {
    try {
      const res = await (ai.models as any).generateContent({
        model,
        config,
        contents,
      });
      return res.text || "";
    } catch (err: unknown) {
      const errMsg = String((err as { message?: string })?.message || "").toLowerCase();
      // If error is 400 specifically mentioning system instructions, retry once with SYSTEM merged into contents
      if (
        config.systemInstruction &&
        (errMsg.includes("system") || errMsg.includes("developer_instruction") || errMsg.includes("system_instruction")) &&
        !errMsg.includes("api key") &&
        !errMsg.includes("not found")
      ) {
        const fallbackConfig = { ...config };
        delete fallbackConfig.systemInstruction;
        const mergedContents = SYSTEM + "\n\n" + contents;
        const retryRes = await (ai.models as any).generateContent({
          model,
          config: fallbackConfig,
          contents: mergedContents,
        });
        return retryRes.text || "";
      }
      throw err;
    }
  })();

  return Promise.race([callPromise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

export interface GenerationResult {
  card: Card;
  source: "model" | "fallback";
  attempts: number;
  model: string;
  latencyMs: number;
  note?: string;
  failures: string[];
  reason?: string;
  busy?: boolean;
  quota?: QuotaStatus;
}

// Single generation pipeline with up to 2 attempts
async function executeGeneration(
  dump: string,
  tooMuch: boolean = false,
  selectedModel: string = DEFAULT_MODEL,
  context?: string,
  profile?: UserProfile
): Promise<GenerationResult> {
  const startTime = Date.now();
  let attempts = 0;
  let lastReason = "unknown error";
  const failures: string[] = [];

  for (let i = 1; i <= 2; i++) {
    // 1. If API key is not configured, do not call model and do not retry
    if (!isGeminiApiKeySet) {
      failures.push("no API key");
      lastReason = "no API key";
      break;
    }

    // 2. Global in-memory quota protection (per-minute & daily limits, or external 429 cooldown)
    const quotaCheck = checkModelQuota();
    if (!quotaCheck.allowed) {
      failures.push("busy");
      lastReason = "busy";
      break;
    }

    attempts = i;
    let prompt = userPrompt(dump, context, profile);
    if (tooMuch) {
      prompt += "\n\n" + TOO_MUCH_SUFFIX;
    }
    if (i === 2) {
      prompt += "\n\n" + retrySuffix(lastReason);
    }

    let rawText: string;
    try {
      recordModelCall();
      rawText = await generateWithTimeout(
        selectedModel,
        {
          systemInstruction: SYSTEM,
          temperature: 0.7,
          maxOutputTokens: 256,
          thinkingConfig: { thinkingLevel: 'minimal' },
        },
        prompt,
        40000
      );
    } catch (err: unknown) {
      const classified = classifyError(err);
      lastReason = classified;
      failures.push(classified);
      if (classified === "busy") {
        markExternal429();
      }
      // Rule: Never retry on a 429 or API call failure. Retry only on validation failures.
      break;
    }

    const jsonRes = extractJson(rawText);
    if (!jsonRes.ok) {
      lastReason = "invalid JSON";
      failures.push("invalid JSON");
      continue;
    }

    const valRes = validate(jsonRes.data);
    if (valRes.ok) {
      const avoidCheck = validateAvoidPreferences((jsonRes.data as Card).action, profile?.avoid);
      if (avoidCheck.ok) {
        return {
          card: jsonRes.data as Card,
          source: "model",
          attempts,
          model: selectedModel,
          latencyMs: Date.now() - startTime,
          failures,
          quota: getQuotaStatus(),
        };
      } else {
        lastReason = avoidCheck.reason || "violates avoid preference";
        failures.push(lastReason);
        continue;
      }
    } else {
      lastReason = valRes.reason;
      failures.push(valRes.reason);
      continue;
    }
  }

  // Fallback return after quota limit, 429, or 2 validation failures
  const isBusy = failures.includes("busy") || lastReason === "busy";
  return {
    card: pickFallback(profile?.avoid),
    source: "fallback",
    attempts,
    model: selectedModel,
    latencyMs: Date.now() - startTime,
    note: isBusy ? BUSY_USER_MESSAGE : "Offered gently, without the model.",
    failures,
    reason: isBusy ? "busy" : (failures[failures.length - 1] || "unknown"),
    busy: isBusy,
    quota: getQuotaStatus(),
  };
}

// POST /api/still
app.post('/api/still', stillLimiter, async (req: Request, res: Response) => {
  const { dump, tooMuch, model, context, profile } = req.body;

  // Validate input: string, trimmed, 1..1000 chars
  if (typeof dump !== 'string') {
    return res.status(400).json({ error: "Invalid input: dump must be a string." });
  }

  const trimmed = dump.trim();
  if (trimmed.length < 1 || trimmed.length > 1000) {
    return res.status(400).json({ error: "Invalid input: dump must be between 1 and 1000 characters." });
  }

  const chosenModel = model || DEFAULT_MODEL;
  if (!ALLOWED_MODELS.has(chosenModel)) {
    return res.status(400).json({ error: "Invalid input: requested model is not allowed." });
  }

  // Validate optional context parameter
  if (context !== undefined && (typeof context !== 'string' || !ALLOWED_CONTEXTS.has(context))) {
    return res.status(400).json({ error: "Invalid input: context must be one of 'Work', 'Home', 'Rest', 'Study'." });
  }

  // Validate profile if provided: only enum values, no free text
  let validatedProfile: UserProfile | undefined = undefined;
  if (profile !== undefined) {
    if (typeof profile !== 'object' || profile === null || Array.isArray(profile)) {
      return res.status(400).json({ error: "Invalid input: profile must be an object." });
    }
    const p: UserProfile = {};
    if (profile.focus !== undefined) {
      if (typeof profile.focus !== 'string' || !ALLOWED_FOCUS.includes(profile.focus as any)) {
        return res.status(400).json({ error: "Invalid input: focus must be one of " + ALLOWED_FOCUS.join(', ') });
      }
      p.focus = profile.focus;
    }
    if (profile.energy !== undefined) {
      if (typeof profile.energy !== 'string' || !ALLOWED_ENERGY.includes(profile.energy as any)) {
        return res.status(400).json({ error: "Invalid input: energy must be one of " + ALLOWED_ENERGY.join(', ') });
      }
      p.energy = profile.energy;
    }
    if (profile.helps !== undefined) {
      if (!Array.isArray(profile.helps) || profile.helps.some((h: any) => typeof h !== 'string' || !ALLOWED_HELPS.includes(h as any))) {
        return res.status(400).json({ error: "Invalid input: helps contains invalid values." });
      }
      p.helps = profile.helps;
    }
    if (profile.avoid !== undefined) {
      if (!Array.isArray(profile.avoid) || profile.avoid.some((a: any) => typeof a !== 'string' || !ALLOWED_AVOIDS.includes(a as any))) {
        return res.status(400).json({ error: "Invalid input: avoid contains invalid values." });
      }
      p.avoid = profile.avoid;
    }
    validatedProfile = p;
  }

  // Safety first: if needsCare(dump) is true, do NOT call the model and do NOT log
  if (needsCare(trimmed)) {
    (res as LoggingResponse).__skipLogging = true;
    return res.status(200).json({ care: CARE_MESSAGE });
  }

  try {
    const result = await executeGeneration(trimmed, !!tooMuch, chosenModel, context, validatedProfile);
    return res.status(200).json(result);
  } catch (_err: unknown) {
    const isBusy = classifyError(_err) === "busy";
    return res.status(200).json({
      card: pickFallback(validatedProfile?.avoid),
      source: "fallback",
      attempts: 0,
      model: chosenModel,
      latencyMs: 0,
      note: isBusy ? BUSY_USER_MESSAGE : "Offered gently, without the model.",
      failures: [isBusy ? "busy" : "unknown error"],
      reason: isBusy ? "busy" : "unknown error",
      busy: isBusy,
      quota: getQuotaStatus(),
    });
  }
});

interface LabResultItem {
  firstPass: boolean;
  attempts: number;
  source: "model" | "fallback" | "care" | "invalid";
  latencyMs: number;
  care: boolean;
}

// POST /api/lab (separate limiter)
app.post('/api/lab', labLimiter, async (req: Request, res: Response) => {
  const { fixtures, model } = req.body;

  if (!Array.isArray(fixtures)) {
    return res.status(400).json({ error: "Invalid input: fixtures must be an array." });
  }

  if (fixtures.length === 0 || fixtures.length > 30) {
    return res.status(400).json({ error: "Invalid input: fixtures must contain between 1 and 30 items." });
  }

  const chosenModel = model || DEFAULT_MODEL;
  if (!ALLOWED_MODELS.has(chosenModel)) {
    return res.status(400).json({ error: "Invalid input: requested model is not allowed." });
  }

  const results: LabResultItem[] = [];

  for (const fixture of fixtures) {
    if (typeof fixture !== 'string') {
      results.push({ firstPass: false, attempts: 0, source: "invalid", latencyMs: 0, care: false });
      continue;
    }

    const trimmed = fixture.trim();
    if (needsCare(trimmed)) {
      results.push({
        firstPass: false,
        attempts: 0,
        source: "care",
        latencyMs: 0,
        care: true,
      });
      continue;
    }

    try {
      const outcome = await executeGeneration(trimmed, false, chosenModel);
      results.push({
        firstPass: outcome.source === "model" && outcome.attempts === 1,
        attempts: outcome.attempts,
        source: outcome.source,
        latencyMs: outcome.latencyMs,
        care: false,
      });
    } catch {
      results.push({
        firstPass: false,
        attempts: 2,
        source: "fallback",
        latencyMs: 0,
        care: false,
      });
    }
  }

  return res.status(200).json({ results });
});

// Setup Vite middleware in dev or static files in production
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Still server listening on http://0.0.0.0:${PORT}`);
    console.log(`[Still] GEMINI_API_KEY is set: ${isGeminiApiKeySet}`);
    console.log(`[Still] Model allowlist: ${Array.from(ALLOWED_MODELS).join(', ')}`);
    console.log(`[Still] Quota limits: ${getDailyLimit()} calls/day, ${getMinuteLimit()} calls/min`);
  });
}

startServer();
