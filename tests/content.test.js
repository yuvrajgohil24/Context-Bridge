// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  estimateTokens,
  joinWithinBudget,
  scrapeClaudeChat,
  scrapeChatGPT,
  scrapeConversation,
} from "../extension/content.js";

function docFrom(html) {
  const doc = document.implementation.createHTMLDocument();
  doc.body.innerHTML = html;
  return doc;
}

describe("estimateTokens", () => {
  it("estimates ~4 chars per token, rounding up", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("abcde")).toBe(2);
  });
});

describe("joinWithinBudget", () => {
  it("keeps all turns when under budget", () => {
    const result = joinWithinBudget(["one", "two", "three"], 1000);
    expect(result.text).toBe("one\n---\ntwo\n---\nthree");
    expect(result.includedTurns).toBe(3);
    expect(result.totalTurns).toBe(3);
  });

  it("drops oldest turns first when over budget", () => {
    const turns = ["oldest".repeat(10), "middle".repeat(10), "newest".repeat(10)];
    const result = joinWithinBudget(turns, 140);
    expect(result.includedTurns).toBe(2);
    expect(result.text).not.toContain("oldest");
    expect(result.text).toContain("newest");
  });

  it("always keeps at least the newest turn, even if it exceeds the budget", () => {
    const result = joinWithinBudget(["x".repeat(500)], 100);
    expect(result.includedTurns).toBe(1);
  });

  it("handles an empty conversation", () => {
    const result = joinWithinBudget([], 100);
    expect(result.text).toBe("");
    expect(result.totalTurns).toBe(0);
  });
});

describe("scrapeChatGPT", () => {
  it("extracts messages with role prefixes", () => {
    const doc = docFrom(`
      <div data-message-author-role="user">Hello there</div>
      <div data-message-author-role="assistant">Hi! How can I help?</div>
    `);
    const turns = scrapeChatGPT(doc);
    expect(turns).toHaveLength(2);
    expect(turns[0]).toMatch(/^USER: /);
    expect(turns[1]).toMatch(/^ASSISTANT: /);
  });

  it("falls back to conversation-turn articles", () => {
    const doc = docFrom(`
      <article data-testid="conversation-turn-1">First message</article>
      <article data-testid="conversation-turn-2">Second message</article>
    `);
    const turns = scrapeChatGPT(doc);
    expect(turns).toHaveLength(2);
  });

  it("returns empty array when no conversation exists", () => {
    expect(scrapeChatGPT(docFrom("<p>marketing page</p>"))).toHaveLength(0);
  });
});

describe("scrapeClaudeChat", () => {
  it("labels turns containing a user-message as HUMAN", () => {
    const doc = docFrom(`
      <div data-testid="conversation-turn"><div data-testid="user-message">My question</div></div>
      <div data-testid="conversation-turn"><div>The answer</div></div>
    `);
    const turns = scrapeClaudeChat(doc);
    expect(turns).toHaveLength(2);
    expect(turns[0]).toMatch(/^HUMAN: /);
    expect(turns[1]).toMatch(/^ASSISTANT: /);
  });
});

describe("scrapeConversation", () => {
  it("routes by hostname and returns [] for unsupported sites", () => {
    const chatgptDoc = docFrom('<div data-message-author-role="user">hi</div>');
    expect(scrapeConversation("https://chatgpt.com/c/123", chatgptDoc)).toHaveLength(1);
    expect(scrapeConversation("https://example.com", chatgptDoc)).toHaveLength(0);
  });
});
