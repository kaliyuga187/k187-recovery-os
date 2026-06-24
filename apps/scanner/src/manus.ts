import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import crypto from "node:crypto";
import type { ManusProject, Project, ProjectSource } from "@k187/shared";
import { detectStack, detectCategory, scoreCompletion, scoreDeployReadiness, scoreHealth, compositeScore, slugify } from "@k187/shared";
import { scanRoot, type RawProjectCandidate } from "./scanner.js";
import { assertSafeCommand } from "./security.js";

/**
 * Import a Manus export from:
 *  - a directory of JSON files (recurses one level)
 *  - a single JSON file
 *  - a .zip archive (extracted to a temp dir using PowerShell's Expand-Archive)
 *  - a GitHub repo URL (cloned shallow to a temp dir)
 *
 * The extracted/cloned files are then scanned as ordinary projects.
 */
export interface ManusImportResult {
  totalFiles: number;
  imported: ManusProject[];
  scanned: Project[];
  errors: Array<{ file: string; message: string }>;
  placeholderProjects: Project[];
  tempDirs: string[];
}

export async function importManus(input: {
  path: string;
  zip?: string;
  github?: string;
}): Promise<ManusImportResult> {
  const errors: Array<{ file: string; message: string }> = [];
  const tempDirs: string[] = [];
  let workDir = "";

  if (input.github) {
    workDir = path.join(os.tmpdir(), `k187-manus-${crypto.randomBytes(4).toString("hex")}`);
    fs.mkdirSync(workDir, { recursive: true });
    tempDirs.push(workDir);
    const cmd = `git clone --depth 1 "${input.github}" "${workDir}"`;
    try {
      assertSafeCommand(cmd);
      execSync(cmd, { stdio: ["pipe", "pipe", "pipe"] });
    } catch (err) {
      errors.push({ file: input.github, message: `git clone failed: ${(err as Error).message}` });
      workDir = "";
    }
  } else if (input.zip) {
    workDir = path.join(os.tmpdir(), `k187-manus-${crypto.randomBytes(4).toString("hex")}`);
    fs.mkdirSync(workDir, { recursive: true });
    tempDirs.push(workDir);
    const cmd = `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${input.zip.replace(/'/g, "''")}' -DestinationPath '${workDir.replace(/'/g, "''")}' -Force"`;
    try {
      assertSafeCommand(cmd);
      execSync(cmd, { stdio: ["pipe", "pipe", "pipe"] });
    } catch (err) {
      errors.push({ file: input.zip, message: `Expand-Archive failed: ${(err as Error).message}` });
      workDir = "";
    }
  } else if (input.path) {
    workDir = input.path;
  } else {
    throw new Error("Pass --path <dir|file>, --zip <file>, or --github <url>");
  }

  if (!workDir) {
    return { totalFiles: 0, imported: [], scanned: [], errors, placeholderProjects: [], tempDirs };
  }

  const stat = await fs.promises.stat(workDir);
  const files: string[] = [];

  if (stat.isDirectory()) {
    // Recurse 1 level to find /manus-export/projects/*.json or any
    // top-level *.json (or subdirs of *.json).
    const topEntries = await fs.promises.readdir(workDir, { withFileTypes: true });
    for (const entry of topEntries) {
      const full = path.join(workDir, entry.name);
      if (entry.isDirectory()) {
        try {
          const sub = await fs.promises.readdir(full);
          for (const s of sub) {
            if (s.endsWith(".json")) files.push(path.join(full, s));
          }
        } catch {
          // unreadable subdir, skip
        }
      } else if (entry.name.endsWith(".json")) {
        files.push(full);
      }
    }
  } else if (stat.isFile()) {
    if (workDir.endsWith(".json")) files.push(workDir);
    else {
      errors.push({ file: workDir, message: "Pass --zip for archives, --github for repos, or point --path at a .json or directory." });
    }
  }

  const imported: ManusProject[] = [];
  const placeholderProjects: Project[] = [];
  for (const f of files) {
    try {
      const buf = await fs.promises.readFile(f, "utf8");
      const json = JSON.parse(buf);
      const records = Array.isArray(json) ? json : [json];
      for (const r of records) {
        const mp = extractManusProject(r);
        imported.push(mp);
        placeholderProjects.push(manusToProject(mp));
      }
    } catch (err) {
      errors.push({ file: f, message: (err as Error).message });
    }
  }

  // After parsing JSON metadata, also scan the workDir itself as a project
  // tree — Manus exports often include the actual source files.
  let scanned: Project[] = [];
  if (stat.isDirectory()) {
    try {
      const { projects: raws, errors: scanErrors } = await scanRoot({ rootPath: workDir, source: "manus-export" });
      errors.push(...scanErrors.map((e) => ({ file: e.path, message: e.message })));
      for (const raw of raws) {
        const m = buildModel(raw, "manus-export");
        scanned.push(m);
      }
    } catch (err) {
      errors.push({ file: workDir, message: `scan failed: ${(err as Error).message}` });
    }
  }

  return {
    totalFiles: files.length,
    imported,
    scanned,
    errors,
    placeholderProjects,
    tempDirs,
  };
}

function buildModel(raw: RawProjectCandidate, source: ProjectSource): Project {
  // re-import here to avoid circular dep with scanner module
  const stack = detectStack(raw.files);
  const category = detectCategory({
    name: raw.name,
    slug: slugify(raw.name),
    stack,
    readmeExcerpt: raw.readmeExcerpt,
  });
  const completionScore = Math.min(
    100,
    (raw.hasReadme ? 15 : 0) +
      (raw.hasTests ? 20 : 0) +
      (raw.hasDocker ? 10 : 0) +
      (raw.hasCi ? 10 : 0) +
      (raw.hasDeployGuide ? 10 : 0) +
      (raw.hasGit ? 10 : 0) +
      (raw.hasBuildArtifacts ? 10 : 0) +
      (stack.length > 0 ? 5 : 0) +
      (raw.files.length > 20 ? 5 : 0) +
      (raw.files.length > 100 ? 5 : 0)
  );
  const deployScore = Math.min(
    100,
    (raw.hasDocker ? 30 : 0) +
      (raw.hasCi ? 20 : 0) +
      (raw.hasDeployGuide ? 20 : 0) +
      (raw.hasEnv ? 10 : 0) +
      (raw.hasBuildArtifacts ? 10 : 0) +
      (stack.some((s: string) => ["nextjs", "vite", "expo", "docker-compose"].includes(s)) ? 10 : 0)
  );
  const composite = Math.round(completionScore * 0.5 + deployScore * 0.3 + 50 * 0.2);
  return {
    id: crypto.createHash("sha1").update(raw.root).digest("hex").slice(0, 16),
    slug: slugify(raw.name),
    name: raw.name,
    path: raw.root,
    source,
    category,
    stack,
    description: raw.packageJson?.description ?? null,
    sizeBytes: raw.sizeBytes,
    fileCount: raw.files.length,
    hasGit: raw.hasGit,
    hasReadme: raw.hasReadme,
    hasEnv: raw.hasEnv,
    hasTests: raw.hasTests,
    hasDocker: raw.hasDocker,
    hasCi: raw.hasCi,
    hasDeployGuide: raw.hasDeployGuide,
    hasBuildArtifacts: raw.hasBuildArtifacts,
    lastModified: raw.lastModified?.toISOString() ?? null,
    firstSeen: new Date().toISOString(),
    completionScore,
    deployScore,
    healthScore: 50,
    compositeScore: composite,
    status: "active",
    notes: null,
    tags: ["manus", "scanned"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function extractManusProject(raw: any): ManusProject {
  // Best-effort: the schema varies. Pull from a few common shapes.
  const uuid = String(raw.uuid ?? raw.id ?? raw.project_id ?? raw.task_id ?? crypto.randomUUID());
  const name = String(
    raw.name ?? raw.title ?? raw.project_name ?? raw.display_name ?? `Manus ${uuid.slice(0, 8)}`
  );
  const description = raw.description ?? raw.summary ?? raw.prompt ?? null;
  const createdAt = raw.created_at ?? raw.createdAt ?? raw.created ?? null;
  const updatedAt = raw.updated_at ?? raw.updatedAt ?? raw.updated ?? null;
  const status = raw.status ?? raw.state ?? null;
  return {
    uuid,
    name,
    description: description ? String(description) : null,
    createdAt: createdAt ? new Date(createdAt).toISOString() : null,
    updatedAt: updatedAt ? new Date(updatedAt).toISOString() : null,
    status: status ? String(status) : null,
    raw,
  };
}

function manusToProject(mp: ManusProject): Project {
  // We don't have file-system access to the Manus project yet, so the
  // placeholder has zero file count and a low composite score. Once the
  // user re-runs `pnpm scan` on the recovered folder, the real numbers
  // overwrite the placeholder.
  const id = crypto.createHash("sha1").update(`manus:${mp.uuid}`).digest("hex").slice(0, 16);
  const slug = slugify(mp.name);
  const source: ProjectSource = "manus-export";
  const now = new Date().toISOString();
  return {
    id,
    slug,
    name: mp.name,
    path: `manus://${mp.uuid}`,
    source,
    category: "unknown",
    stack: ["manus"],
    description: mp.description,
    sizeBytes: 0,
    fileCount: 0,
    hasGit: false,
    hasReadme: !!mp.description,
    hasEnv: false,
    hasTests: false,
    hasDocker: false,
    hasCi: false,
    hasDeployGuide: false,
    hasBuildArtifacts: false,
    lastModified: mp.updatedAt,
    firstSeen: now,
    completionScore: mp.description ? 5 : 0,
    deployScore: 0,
    healthScore: 20,
    compositeScore: 5,
    status: "active",
    notes: `Recovered from Manus export (uuid=${mp.uuid}). Re-scan with pnpm scan --path <recovered-folder> once you export the source files.`,
    tags: ["manus", "placeholder"],
    createdAt: now,
    updatedAt: now,
  };
}
