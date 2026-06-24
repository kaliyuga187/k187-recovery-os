import { describe, it, expect } from "vitest";
import { detectCategory } from "./category.js";

describe("category detection", () => {
  it("detects trading bots by name", () => {
    expect(
      detectCategory({ name: "apex-trading-bot", slug: "apex-trading-bot", stack: [], readmeExcerpt: "" })
    ).toBe("trading-bot");
  });

  it("detects mobile apps by stack", () => {
    expect(
      detectCategory({ name: "foo", slug: "foo", stack: ["expo", "react-native"], readmeExcerpt: "" })
    ).toBe("mobile-app");
  });

  it("detects web apps by nextjs stack", () => {
    expect(
      detectCategory({ name: "bar", slug: "bar", stack: ["nextjs"], readmeExcerpt: "" })
    ).toBe("web-app");
  });

  it("detects ai-agents by name", () => {
    expect(
      detectCategory({ name: "agent-pipeline", slug: "agent-pipeline", stack: [], readmeExcerpt: "" })
    ).toBe("ai-agent");
  });

  it("returns unknown when nothing matches", () => {
    expect(
      detectCategory({ name: "x", slug: "x", stack: [], readmeExcerpt: "" })
    ).toBe("unknown");
  });
});
