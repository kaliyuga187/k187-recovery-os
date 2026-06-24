import { describe, it, expect } from "vitest";
import { scoreCompletion, scoreDeployReadiness, scoreHealth, compositeScore } from "./scoring.js";

describe("scoring", () => {
  it("scoreCompletion gives 0 for an empty project", () => {
    expect(
      scoreCompletion({
        hasReadme: false, hasTests: false, hasDocker: false, hasCi: false,
        hasDeployGuide: false, hasGit: false, hasBuildArtifacts: false,
        stack: [], fileCount: 0,
      })
    ).toBe(0);
  });

  it("scoreCompletion caps at 100", () => {
    expect(
      scoreCompletion({
        hasReadme: true, hasTests: true, hasDocker: true, hasCi: true,
        hasDeployGuide: true, hasGit: true, hasBuildArtifacts: true,
        stack: ["x"], fileCount: 9999,
      })
    ).toBe(100);
  });

  it("scoreDeployReadiness is 30 for a dockerized project", () => {
    expect(
      scoreDeployReadiness({
        hasDocker: true, hasCi: false, hasDeployGuide: false, hasEnv: false,
        hasBuildArtifacts: false, stack: [],
      })
    ).toBe(30);
  });

  it("scoreHealth is at least 0 and at most 100", () => {
    const base = {
      hasGit: true, hasReadme: true, hasTests: true,
      fileCount: 10, stack: ["node"], lastModified: new Date().toISOString(),
      sizeBytes: 1024,
    };
    expect(scoreHealth(base)).toBeGreaterThanOrEqual(0);
    expect(scoreHealth(base)).toBeLessThanOrEqual(100);
  });

  it("compositeScore is a weighted blend", () => {
    expect(compositeScore(100, 100, 100)).toBe(100);
    expect(compositeScore(0, 0, 0)).toBe(0);
    expect(compositeScore(50, 50, 50)).toBe(50);
  });
});
