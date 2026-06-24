import { prisma } from "@k187/db";
import type { Project, DuplicateGroup, WeeklyReport } from "@k187/shared";
import { groupDuplicates } from "@k187/shared";

/** Hydrate a Prisma Project row into the shared Project shape. */
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

function safeJsonArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export async function listProjects(): Promise<Project[]> {
  const rows = await prisma.project.findMany({ orderBy: { compositeScore: "desc" } });
  return rows.map(hydrate);
}

export async function findProjectBySlug(slug: string): Promise<Project | null> {
  const row = await prisma.project.findUnique({ where: { slug } });
  return row ? hydrate(row) : null;
}

export async function listDuplicateGroups(): Promise<DuplicateGroup[]> {
  const projects = await listProjects();
  const groups = groupDuplicates(projects);
  // sync to db
  await prisma.duplicateGroup.deleteMany({});
  for (const g of groups) {
    await prisma.duplicateGroup.create({
      data: {
        id: g.id,
        fingerprint: g.fingerprint,
        projectIds: JSON.stringify(g.projects.map((p) => p.id)),
        recommendation: g.recommendation,
        reason: g.reason,
      },
    });
  }
  return groups;
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

export async function setActiveBuild(projectId: string, reason?: string): Promise<void> {
  await prisma.activeBuild.updateMany({ data: { isPaused: true } });
  await prisma.activeBuild.create({
    data: { projectId, reason: reason ?? null, isPaused: false },
  });
}

export async function pauseActiveBuild(): Promise<void> {
  await prisma.activeBuild.updateMany({ data: { isPaused: true } });
}

export async function completeActiveBuild(): Promise<void> {
  const a = await prisma.activeBuild.findFirst({ where: { isPaused: false } });
  if (!a) return;
  await prisma.project.update({ where: { id: a.projectId }, data: { status: "complete" } });
  await prisma.activeBuild.updateMany({ data: { isPaused: true } });
}

export async function generateWeeklyReport(): Promise<WeeklyReport> {
  const all = await listProjects();
  const dups = await listDuplicateGroups();

  const topComplete = all
    .slice()
    .sort((a, b) => b.completionScore - a.completionScore)
    .slice(0, 5);

  // "stuck" = status=active, no recent edits, low health
  const topStuck = all
    .filter((p) => p.status === "active")
    .filter((p) => p.healthScore < 50)
    .slice()
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 5);

  const focusPick = topComplete[0] ?? null;
  const ignorePick = topStuck[topStuck.length - 1] ?? null;

  const active = await getActiveBuild();

  const avg = all.length
    ? Math.round(all.reduce((s, p) => s + p.completionScore, 0) / all.length)
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    topComplete,
    topStuck,
    topDuplicates: dups.slice(0, 5),
    focusPick,
    ignorePick,
    totals: {
      totalProjects: all.length,
      totalDuplicates: dups.length,
      averageCompletion: avg,
      activeBuild: active,
    },
  };
}
