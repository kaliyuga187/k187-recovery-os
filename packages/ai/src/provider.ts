import type { Project } from "@k187/shared";
import { redactSecrets } from "@k187/shared";

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  analyze(input: { projects: Project[]; prompt?: string }): Promise<ProviderAnalysis>;
}

export interface ProviderAnalysis {
  modelUsed: string;
  rawText: string;
  parsed: ParsedAnalysis;
}

export interface ParsedAnalysis {
  summary: string;
  recommendedAction: "finish" | "polish" | "deploy" | "monetize" | "expand" | "archive" | "ignore";
  rationale: string;
  nextSteps: string[];
  risks: string[];
}

export const PROVIDER_REGISTRY: Record<string, () => AIProvider> = {
  "minimax-m3": () => new MiniMaxM3Provider(),
  "openrouter-minimax-m3": () => new OpenRouterMiniMaxM3Provider(),
  "openrouter": () => new OpenRouterProvider(),
  "none": () => new NoopProvider(),
};

export function getProvider(name?: string): AIProvider {
  const key = name ?? process.env.K187_AI_PROVIDER ?? "none";
  const factory = PROVIDER_REGISTRY[key];
  if (!factory) throw new Error(`Unknown AI provider: ${key}`);
  return factory();
}

class NoopProvider implements AIProvider {
  readonly name = "none";
  readonly model = "none";
  async analyze({ projects }: { projects: Project[] }): Promise<ProviderAnalysis> {
    const p = projects[0];
    const summary = p
      ? `Heuristic analysis only (no AI provider configured). ${p.name} has completion=${p.completionScore}, deploy=${p.deployScore}, health=${p.healthScore}.`
      : "No project provided.";
    return {
      modelUsed: "heuristic",
      rawText: summary,
      parsed: {
        summary,
        recommendedAction: pickHeuristicAction(projects[0]),
        rationale: "No AI provider configured. Set K187_AI_PROVIDER=minimax-m3 and a key to enable deep analysis.",
        nextSteps: [
          "Configure an AI provider (see packages/ai/README.md).",
          "Re-run pnpm analyze:long --project <slug>",
        ],
        risks: ["Analysis is heuristic only — no LLM context applied."],
      },
    };
  }
}

class MiniMaxM3Provider implements AIProvider {
  readonly name = "minimax-m3";
  readonly model = "MiniMax-M3";
  async analyze({ projects, prompt }: { projects: Project[]; prompt?: string }): Promise<ProviderAnalysis> {
    const apiKey = process.env.MINIMAX_API_KEY;
    const baseUrl = process.env.MINIMAX_BASE_URL ?? "https://api.minimax.example/v1";
    if (!apiKey) {
      throw new Error(
        "MINIMAX_API_KEY is not set. The provider refuses to run without a key. " +
        "Set it in your environment, or unset K187_AI_PROVIDER to use the heuristic provider."
      );
    }

    // Redact before sending — defense in depth.
    const safeProjects = projects.map((p) => ({
      ...p,
      path: redactSecrets(p.path).text,
      description: p.description ? redactSecrets(p.description).text : null,
    }));

    const systemPrompt = [
      "You are a senior build-recovery analyst.",
      "You help a solo operator (Kali) decide which of his many half-finished builds to finish first.",
      "Output a JSON object with: summary, recommendedAction (finish|polish|deploy|monetize|expand|archive|ignore),",
      "rationale, nextSteps (array of 1-5 short imperative strings), risks (array of short strings).",
      "Do not invent facts. If uncertain, say so. Do not leak secrets.",
      "Return JSON only — no ```json fences, no prose before or after the object."
    ].join(" ");

    const userPrompt = prompt ?? JSON.stringify({ projects: safeProjects }, null, 2);

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "MiniMax-M3",
        temperature: 0.2,
        max_tokens: 4000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`MiniMax M3 call failed: ${res.status} ${res.statusText} :: ${body.slice(0, 300)}`);
    }

    const json: any = await res.json();
    const rawText: string = json?.choices?.[0]?.message?.content ?? "";
    const parsed = safeParse(rawText) ?? {
      summary: rawText.slice(0, 400) || "No content returned.",
      recommendedAction: pickHeuristicAction(projects[0]),
      rationale: "Could not parse structured JSON from the model; falling back to heuristic.",
      nextSteps: ["Re-run with a tighter prompt.", "Verify MINIMAX_BASE_URL is correct."],
      risks: ["Structured output not received."],
    };

    return { modelUsed: this.model, rawText, parsed };
  }
}

function safeParse(text: string): ParsedAnalysis | null {
  // Strip ```json ... ``` or ``` ... ``` fences if present, then find the
  // first {...} JSON block. This is what the recovery-OS operator reports
  // depend on; without it, every model that wraps its JSON in fences
  // (MiniMax M3 included) trips the heuristic fallback.
  let cleaned = text.trim();
  const fence = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/m);
  if (fence) cleaned = fence[1].trim();
  // Try the whole cleaned string first (model emitted pure JSON).
  try {
    const obj = JSON.parse(cleaned);
    if (obj && typeof obj === "object" && obj.summary) return fromObj(obj);
  } catch {
    /* fall through to slice-extraction */
  }
  // Otherwise find the first balanced {...} block.
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    return fromObj(obj);
  } catch {
    return null;
  }
}

function fromObj(obj: any): ParsedAnalysis | null {
  if (!obj || typeof obj !== "object" || !obj.summary) return null;
  return {
    summary: String(obj.summary),
    recommendedAction: obj.recommendedAction ?? "finish",
    rationale: String(obj.rationale ?? ""),
    nextSteps: Array.isArray(obj.nextSteps) ? obj.nextSteps.map(String) : [],
    risks: Array.isArray(obj.risks) ? obj.risks.map(String) : [],
  };
}

/**
 * OpenRouter-backed provider. Routes any model through OpenRouter's unified
 * OpenAI-compatible chat completions API. Default model is MiniMax M3.
 * Reads OPENROUTER_API_KEY (or K187_OPENROUTER_API_KEY) and OPENROUTER_MODEL
 * (or K187_OPENROUTER_MODEL) from the environment.
 */
class OpenRouterProvider implements AIProvider {
  readonly name = "openrouter";
  readonly model: string;

  constructor() {
    this.model = process.env.K187_OPENROUTER_MODEL ?? process.env.OPENROUTER_MODEL ?? "minimax/minimax-m3";
  }

  async analyze({ projects, prompt }: { projects: Project[]; prompt?: string }): Promise<ProviderAnalysis> {
    const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.K187_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY is not set. Either set it, or unset K187_AI_PROVIDER to use the heuristic provider."
      );
    }
    const baseUrl = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

    const safeProjects = projects.map((p) => ({
      ...p,
      path: redactSecrets(p.path).text,
      description: p.description ? redactSecrets(p.description).text : null,
    }));

    const systemPrompt = [
      "You are a senior build-recovery analyst.",
      "You help a solo operator (Kali) decide which of his many half-finished builds to finish first.",
      "Output a JSON object with: summary, recommendedAction (finish|polish|deploy|monetize|expand|archive|ignore),",
      "rationale, nextSteps (array of 1-5 short imperative strings), risks (array of short strings).",
      "Do not invent facts. If uncertain, say so. Do not leak secrets.",
      "Return JSON only — no ```json fences, no prose before or after the object."
    ].join(" ");

    const userPrompt = prompt ?? JSON.stringify({ projects: safeProjects }, null, 2);

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.OPENROUTER_REFERER ?? "https://k187-recovery-os.local",
        "X-Title": "K187 Recovery OS",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        max_tokens: 4000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenRouter call failed: ${res.status} ${res.statusText} :: ${body.slice(0, 300)}`);
    }
    const json: any = await res.json();
    const rawText: string = json?.choices?.[0]?.message?.content ?? "";
    const parsed = safeParse(rawText) ?? {
      summary: rawText.slice(0, 400) || "No content returned.",
      recommendedAction: pickHeuristicAction(projects[0]),
      rationale: "Could not parse structured JSON from the model; falling back to heuristic.",
      nextSteps: ["Re-run with a tighter prompt.", "Verify OPENROUTER_MODEL is a valid model slug."],
      risks: ["Structured output not received."],
    };
    return { modelUsed: this.model, rawText, parsed };
  }
}

/** Convenience: explicitly MiniMax M3 via OpenRouter. */
class OpenRouterMiniMaxM3Provider extends OpenRouterProvider {
  constructor() {
    super();
    (this as { model: string }).model = "minimax/minimax-m3";
  }
}
Object.defineProperty(OpenRouterMiniMaxM3Provider.prototype, "name", {
  value: "openrouter-minimax-m3",
  writable: false,
});

function pickHeuristicAction(p: Project | undefined): ParsedAnalysis["recommendedAction"] {
  if (!p) return "ignore";
  if (p.completionScore >= 70 && p.deployScore >= 60) return "deploy";
  if (p.completionScore >= 50) return "finish";
  if (p.completionScore >= 30) return "polish";
  if (p.hasBuildArtifacts) return "monetize";
  return "archive";
}
