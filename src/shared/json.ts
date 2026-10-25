// Zero AI dependencies by design.

export function extractJson(raw: string): { ok: true; data: unknown } | { ok: false; reason: string } {
  if (!raw || typeof raw !== "string") {
    return { ok: false, reason: "empty response" };
  }
  // Strip markdown code fences like ```json ... ``` or ``` ... ```
  const clean = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return { ok: false, reason: "response was not valid JSON" };
  }
  const jsonStr = clean.substring(firstBrace, lastBrace + 1);
  try {
    const parsed = JSON.parse(jsonStr);
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, reason: "response was not valid JSON" };
  }
}
