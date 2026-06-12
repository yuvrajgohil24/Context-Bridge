import { GoogleGenerativeAI } from "@google/generative-ai";
import { COMPRESSION_SYSTEM_PROMPT } from "../../../lib/prompts";

// Keep request bodies bounded so a single caller can't send megabytes of
// text into the LLM (cost) or the JSON parser (memory).
const MAX_CONVERSATION_CHARS = 120_000;

// Best-effort in-memory rate limit. Good enough for a single-instance
// deployment; swap for Redis/Upstash if this ever runs on multiple instances.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestLog = new Map<string, number[]>();

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const recent = (requestLog.get(clientId) ?? []).filter((t) => t > cutoff);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(clientId, recent);
    return true;
  }
  recent.push(now);
  requestLog.set(clientId, recent);
  // Drop stale entries so the map doesn't grow unbounded.
  if (requestLog.size > 1000) {
    for (const [key, times] of requestLog) {
      if (times.every((t) => t <= cutoff)) requestLog.delete(key);
    }
  }
  return false;
}

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set");
    return Response.json({ error: "Server is not configured" }, { status: 500 });
  }

  const clientId = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (isRateLimited(clientId)) {
    return Response.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 }
    );
  }

  let conversation: unknown;
  try {
    ({ conversation } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof conversation !== "string" || !conversation.trim()) {
    return Response.json({ error: "No conversation provided" }, { status: 400 });
  }

  if (conversation.length > MAX_CONVERSATION_CHARS) {
    return Response.json(
      { error: `Conversation too long (max ${MAX_CONVERSATION_CHARS.toLocaleString()} characters)` },
      { status: 413 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `${COMPRESSION_SYSTEM_PROMPT}\n\nConversation:\n${conversation}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return Response.json({ compressed: text });
  } catch (error) {
    // Log the real error server-side, but never leak SDK internals to the client.
    console.error("Compression Error:", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("429") || /quota|rate/i.test(message)) {
      return Response.json(
        { error: "The AI service is rate-limited right now. Try again shortly." },
        { status: 503 }
      );
    }
    return Response.json({ error: "Compression failed. Try again." }, { status: 500 });
  }
}
