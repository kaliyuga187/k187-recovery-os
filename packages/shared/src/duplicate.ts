import type { Project, DuplicateGroup } from "./types.js";

/**
 * Generate a stable fingerprint from a project's name + stack + first file
 * list. Used to group near-duplicates.
 */
export function fingerprint(project: Pick<Project, "name" | "stack" | "sizeBytes" | "fileCount">): string {
  const norm = project.name
    .toLowerCase()
    .replace(/\s*\(?\d+\)?$/g, "") // strip trailing (1)
    .replace(/[-_]+/g, "-")
    .replace(/\.(zip|tar\.gz|tgz)$/i, "")
    .replace(/-(git-only|extracted|backup|copy|clone|dupe|duplicate|old|new|v\d+)$/i, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");

  const stackSig = project.stack.slice().sort().join(",");
  // Use only the name + stack. Drop size bucket from the fingerprint so
  // "meme-agent" (2MB) and "meme-agent-git-only" (61KB) match. The
  // groupDuplicates() function does a stricter size sanity check.
  return `${norm}::${stackSig}`;
}

function bucketSize(bytes: number): string {
  if (bytes < 10_000) return "xs";
  if (bytes < 100_000) return "s";
  if (bytes < 1_000_000) return "m";
  if (bytes < 10_000_000) return "l";
  if (bytes < 100_000_000) return "xl";
  return "xxl";
}

export function groupDuplicates(projects: Project[]): DuplicateGroup[] {
  const byFp = new Map<string, Project[]>();
  for (const p of projects) {
    const fp = fingerprint(p);
    const arr = byFp.get(fp) ?? [];
    arr.push(p);
    byFp.set(fp, arr);
  }

  const groups: DuplicateGroup[] = [];
  let gid = 0;
  for (const [fp, list] of byFp) {
    if (list.length < 2) continue;

    // Sanity check: if the largest is 1000x the smallest, it's not a real
    // duplicate (probably a totally different project that happened to share
    // a base name).
    const sizes = list.map((p) => p.sizeBytes).filter((s) => s > 0);
    if (sizes.length > 0) {
      const max = Math.max(...sizes);
      const min = Math.min(...sizes);
      if (max > min * 1000) continue;
    }

    // Pick keep = largest + has git + most files + most recent
    const ranked = list
      .slice()
      .sort((a, b) => scoreForKeep(b) - scoreForKeep(a));
    const winner = ranked[0];
    const reason = `Best of ${list.length}: ${[
      winner.hasGit ? "git" : null,
      winner.hasReadme ? "readme" : null,
      `${winner.fileCount} files`,
      winner.lastModified ? `last edit ${winner.lastModified.slice(0, 10)}` : null,
    ]
      .filter(Boolean)
      .join(", ")}`;

    groups.push({
      id: `dup-${gid++}`,
      fingerprint: fp,
      projects: ranked,
      recommendation: "keep",
      reason,
    });
  }
  return groups;
}

function scoreForKeep(p: Project): number {
  let s = 0;
  if (p.hasGit) s += 100;
  if (p.hasReadme) s += 30;
  if (p.hasTests) s += 40;
  if (p.hasDocker) s += 20;
  if (p.hasDeployGuide) s += 25;
  if (p.hasBuildArtifacts) s += 15;
  s += Math.min(p.fileCount, 500) / 10;
  s += p.completionScore;
  if (p.lastModified) {
    const ageDays = (Date.now() - new Date(p.lastModified).getTime()) / 86_400_000;
    s += Math.max(0, 30 - ageDays) * 0.5;
  }
  return s;
}
