// Server-side data accessors for the Next.js dashboard.
// Mirrors the scanner's reports.ts but reachable from server components.
import { prisma } from "@k187/db";
import { groupDuplicates } from "@k187/shared";
import type { Project, DuplicateGroup } from "@k187/shared";

function safeJsonArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function hydrate(row: any): Project {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    path: row.path,
    source: row.source,
    category: row.category,
    stack: safeJsonArray(row.stack),
    description: row.description,
    sizeBytes: row.sizeBytes,
    fileCount: row.fileCount,
    hasGit: row.hasGit,
    hasReadme: row.hasReadme,
    hasEnv: row.hasEnv,
    hasTests: row.hasTests,
    hasDocker: row.hasDocker,
    hasCi: row.hasCi,
    hasDeployGuide: row.hasDeployGuide,
    hasBuildArtifacts: row.hasBuildArtifacts,
    lastModified: row.lastModified ? row.lastModified.toISOString() : null,
    firstSeen: row.firstSeen.toISOString(),
    completionScore: row.completionScore,
    deployScore: row.deployScore,
    healthScore: row.healthScore,
    compositeScore: row.compositeScore,
    status: row.status,
    notes: row.notes,
    tags: safeJsonArray(row.tags),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listProjects(): Promise<Project[]> {
  const rows = await prisma.project.findMany({ orderBy: { compositeScore: "desc" } });
  return rows.map(hydrate);
}

export async function getProject(slug: string): Promise<Project | null> {
  const row = await prisma.project.findUnique({ where: { slug } });
  return row ? hydrate(row) : null;
}

export async function getAnalyses(projectId: string) {
  return prisma.aIAnalysis.findMany({
    where: { projectId },
    orderBy: { generatedAt: "desc" },
  });
}

export async function listDuplicateGroups(): Promise<DuplicateGroup[]> {
  const projects = await listProjects();
  return groupDuplicates(projects);
}

export async function getActiveBuild(): Promise<Project | null> {
  const row = await prisma.activeBuild.findFirst({
    where: { isPaused: false },
    orderBy: { setAt: "desc" },
  });
  if (!row) return null;
  const p = await prisma.project.findUnique({ where: { id: row.projectId } });
  return p ? hydrate(p) : null;
}
