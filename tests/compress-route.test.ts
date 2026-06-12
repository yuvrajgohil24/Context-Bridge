import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        generateContent: async () => ({
          response: { text: () => "**[GOAL]**\n- Mocked summary" },
        }),
      };
    }
  },
}));

import { POST } from "../app/api/compress/route";

let requestCounter = 0;
function makeRequest(body: unknown, ip?: string) {
  // Unique IP per request unless a test wants to share one (rate-limit test).
  const clientIp = ip ?? `10.0.0.${++requestCounter}`;
  return new Request("http://localhost:3000/api/compress", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": clientIp,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeAll(() => {
  process.env.GEMINI_API_KEY = "test-key";
});

describe("POST /api/compress", () => {
  it("compresses a valid conversation", async () => {
    const res = await POST(makeRequest({ conversation: "HUMAN: hi\n---\nASSISTANT: hello" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.compressed).toContain("[GOAL]");
  });

  it("rejects a missing conversation", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("rejects a non-string conversation", async () => {
    const res = await POST(makeRequest({ conversation: 42 }));
    expect(res.status).toBe(400);
  });

  it("rejects invalid JSON", async () => {
    const res = await POST(makeRequest("not json{"));
    expect(res.status).toBe(400);
  });

  it("rejects oversized conversations with 413", async () => {
    const res = await POST(makeRequest({ conversation: "x".repeat(120_001) }));
    expect(res.status).toBe(413);
  });

  it("rate-limits after 10 requests per minute from one client", async () => {
    const ip = "192.168.1.99";
    for (let i = 0; i < 10; i++) {
      const res = await POST(makeRequest({ conversation: "hi" }, ip));
      expect(res.status).toBe(200);
    }
    const blocked = await POST(makeRequest({ conversation: "hi" }, ip));
    expect(blocked.status).toBe(429);
  });
});
