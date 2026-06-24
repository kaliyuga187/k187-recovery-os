import { describe, it, expect } from "vitest";
import { groupDuplicates, fingerprint } from "./duplicate.js";
import type { Project } from "./types.js";

function mkProject(over: Partial<Project>): Project {
  const base: Project = {
    id: "x", slug: "x", name: "x", path: "C:/x", source: "local",
    category: "unknown", stack: [], description: null,
    sizeBytes: 1000, fileCount: 10,
    hasGit: false, hasReadme: false, hasEnv: false,
    hasTests: false, hasDocker: false, hasCi: false,
    hasDeployGuide: false, hasBuildArtifacts: false,
    lastModified: null, firstSeen: new Date().toISOString(),
    completionScore: 0, deployScore: 0, healthScore: 0, compositeScore: 0,
    status: "active", notes: null, tags: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  return { ...base, ...over };
}

describe("duplicate detection", () => {
  it("fingerprint strips git-only suffix and parentheses-number", () => {
    const fp1 = fingerprint({ name: "meme-agent", stack: ["vite"], sizeBytes: 1000, fileCount: 10 });
    const fp2 = fingerprint({ name: "meme-agent-git-only", stack: ["vite"], sizeBytes: 100, fileCount: 5 });
    expect(fp1).toBe(fp2);
  });

  it("groups projects sharing a fingerprint", () => {
    const projects = [
      mkProject({ id: "1", slug: "meme-agent", name: "meme-agent", path: "C:/a", stack: ["vite"], fileCount: 100, sizeBytes: 1000 }),
      mkProject({ id: "2", slug: "meme-agent-git-only", name: "meme-agent-git-only", path: "C:/b", stack: ["vite"], fileCount: 50, sizeBytes: 800 }),
    ];
    const groups = groupDuplicates(projects);
    expect(groups).toHaveLength(1);
    expect(groups[0].projects[0].fileCount).toBe(100); // keep the larger one
  });

  it("does not group if sizes differ by > 1000x", () => {
    const projects = [
      mkProject({ id: "1", slug: "tiny", name: "tiny", path: "C:/a", fileCount: 1, sizeBytes: 10 }),
      mkProject({ id: "2", slug: "huge", name: "huge", path: "C:/b", fileCount: 99999, sizeBytes: 10_000_000 }),
    ];
    expect(groupDuplicates(projects)).toHaveLength(0);
  });

  it("does not group if only one project matches the fingerprint", () => {
    const projects = [mkProject({ slug: "unique", name: "unique", path: "C:/a" })];
    expect(groupDuplicates(projects)).toHaveLength(0);
  });
});
