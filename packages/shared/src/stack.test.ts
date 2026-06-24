import { describe, it, expect } from "vitest";
import { detectStack } from "./stack.js";

describe("stack detection", () => {
  it("detects node + pnpm + typescript from lockfile + config files", () => {
    const stack = detectStack(["package.json", "pnpm-lock.yaml", "tsconfig.json"]);
    expect(stack).toContain("node");
    expect(stack).toContain("pnpm");
    expect(stack).toContain("typescript");
  });

  it("detects python", () => {
    const stack = detectStack(["requirements.txt", "main.py"]);
    expect(stack).toContain("python");
  });

  it("detects docker + ci", () => {
    const stack = detectStack([
      "Dockerfile",
      "docker-compose.yml",
      ".github/workflows/ci.yml",
    ]);
    expect(stack).toContain("docker");
    expect(stack).toContain("docker-compose");
    expect(stack).toContain("github-actions");
  });

  it("returns empty for empty file list", () => {
    expect(detectStack([])).toEqual([]);
  });
});
