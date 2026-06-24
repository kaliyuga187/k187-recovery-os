import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Project, ProjectSource, ScanError } from "@k187/shared";
import { detectStack, detectCategory, scoreCompletion, scoreDeployReadiness, scoreHealth, compositeScore } from "@k187/shared";

const SKIP_DIRS = new Set([
  // Build artifacts & dependencies
  "node_modules", ".git", ".next", ".turbo", ".cache", "dist", "build", "out",
  ".expo", ".vercel", ".netlify", ".parcel-cache", "coverage", ".nyc_output",
  "target", "venv", ".venv", "__pycache__", ".pytest_cache", ".mypy_cache",
  ".gradle", ".idea", ".vscode", ".DS_Store",
  // Vendor / 3rd-party trees
  "vendor", "third_party", "Pods",
]);

const SKIP_FILE_PATTERNS: RegExp[] = [
  // Secrets — never read, store, or print
  /^\.env(\.|$)/i,
  /^\.envrc$/i,
  /\.pem$/i,
  /\.key$/i,
  /\.pfx$/i,
  /\.p12$/i,
  /id_rsa/i,
  /id_ed25519/i,
  /id_dsa/i,
  /id_ecdsa/i,
  /\.ssh\//i,
  /\.npmrc$/i,
  /\.pypirc$/i,
  /\.netrc$/i,
  /secrets?\.(json|ya?ml|toml)$/i,
  /credentials?\.json$/i,
  /service-account.*\.json$/i,
  /gha-token/i,
  // Known secret filenames
  /\.keystore$/i,
  /\.jks$/i,
  /wallet\.dat$/i,
  /wallet\.json$/i,
  /keystore\.json$/i,
  /\bseed[._-]?phrase/i,
  /mnemonic\.(txt|json)$/i,
  // Encoded obfuscation hints
  /\.b64$/i,
  /\.b64url$/i,
];

const MAX_DEPTH = 6;
const MAX_FILES_PER_PROJECT = 2000;

export interface ScanOptions {
  rootPath: string;
  source: ProjectSource;
  maxDepth?: number;
  followSymlinks?: boolean;
}

export interface RawProjectCandidate {
  root: string;
  name: string;
  files: string[];
  sizeBytes: number;
  hasGit: boolean;
  hasReadme: boolean;
  hasEnv: boolean;
  hasTests: boolean;
  hasDocker: boolean;
  hasCi: boolean;
  hasDeployGuide: boolean;
  hasBuildArtifacts: boolean;
  readmeExcerpt: string;
  lastModified: Date | null;
  packageJson: { name?: string; description?: string } | null;
}

export async function scanRoot(opts: ScanOptions): Promise<{ projects: RawProjectCandidate[]; errors: ScanError[] }> {
  const projects: RawProjectCandidate[] = [];
  const errors: ScanError[] = [];
  const maxDepth = opts.maxDepth ?? MAX_DEPTH;
  const follow = opts.followSymlinks ?? false;

  await walk(opts.rootPath, 0, maxDepth, follow, projects, errors, opts.rootPath);

  return { projects, errors };
}

async function walk(
  dir: string,
  depth: number,
  maxDepth: number,
  follow: boolean,
  projects: RawProjectCandidate[],
  errors: ScanError[],
  rootPath: string
): Promise<void> {
  if (depth > maxDepth) return;
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch (err) {
    errors.push({ path: dir, message: (err as Error).message });
    return;
  }

  // Detect a "project root" by markers
  const markers = countProjectMarkers(entries.map((e) => e.name));
  const looksLikeProject = markers > 0;

  if (looksLikeProject) {
    const project = await collectProject(dir, entries, rootPath, errors);
    projects.push(project);
    return; // do not recurse further; treat this dir as a project root
  }

  // Otherwise recurse
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith(".") && entry.name !== ".github" && entry.name !== ".hermes") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, depth + 1, maxDepth, follow, projects, errors, rootPath);
    } else if (entry.isSymbolicLink() && follow) {
      try {
        const real = await fs.promises.realpath(full);
        const stat = await fs.promises.stat(real);
        if (stat.isDirectory()) await walk(real, depth + 1, maxDepth, follow, projects, errors, rootPath);
      } catch {
        // ignore broken symlink
      }
    }
  }
}

function countProjectMarkers(names: string[]): number {
  const set = new Set(names);
  let m = 0;
  if (set.has("package.json")) m++;
  if (set.has("pyproject.toml")) m++;
  if (set.has("requirements.txt")) m++;
  if (set.has("Pipfile")) m++;
  if (set.has("Cargo.toml")) m++;
  if (set.has("go.mod")) m++;
  if (set.has("README.md") || set.has("README.rst") || set.has("README")) m++;
  if (set.has("Dockerfile") || set.has("docker-compose.yml") || set.has("docker-compose.yaml")) m++;
  if (set.has(".git")) m++;
  if (set.has("app.config.ts") || set.has("app.json")) m++; // expo
  if (set.has("next.config.js") || set.has("next.config.ts") || set.has("next.config.mjs")) m++;
  if (set.has("vite.config.js") || set.has("vite.config.ts")) m++;
  return m;
}

async function collectProject(
  root: string,
  topEntries: fs.Dirent[],
  scanRootPath: string,
  errors: ScanError[]
): Promise<RawProjectCandidate> {
  const files: string[] = [];
  let sizeBytes = 0;
  let lastModified: Date | null = null;

  const queue: Array<{ dir: string; depth: number }> = [{ dir: root, depth: 0 }];

  let hasGit = false;
  let hasReadme = false;
  let hasEnv = false;
  let hasTests = false;
  let hasDocker = false;
  let hasCi = false;
  let hasDeployGuide = false;
  let hasBuildArtifacts = false;
  let readmeExcerpt = "";
  let packageJson: { name?: string; description?: string } | null = null;

  while (queue.length) {
    const { dir, depth } = queue.shift()!;
    if (depth > 4) continue;
    if (files.length > MAX_FILES_PER_PROJECT) continue;

    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch (err) {
      errors.push({ path: dir, message: (err as Error).message });
      continue;
    }

    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full).split(path.sep).join("/");
      const lname = entry.name.toLowerCase();

      // Secret / credential files: never read or store their contents.
      // We still record their existence (hasEnv flag) for context, but we
      // skip their file content entirely.
      if (SKIP_FILE_PATTERNS.some((p) => p.test(rel) || p.test(lname))) {
        if (lname.startsWith(".env") || lname === ".envrc") hasEnv = true;
        // Do not add to files[] or read content.
        continue;
      }

      if (entry.isDirectory()) {
        // we DO want to peek into test/, .github/workflows/, android/, ios/, etc.
        if (
          entry.name === "test" || entry.name === "tests" || entry.name === "__tests__" ||
          entry.name === "spec" || entry.name === ".github" || entry.name === "android" ||
          entry.name === "ios" || entry.name === "src" || entry.name === "app" ||
          entry.name === "lib" || entry.name === "server" || entry.name === "client" ||
          entry.name === "shared" || entry.name === "components" || entry.name === "pages" ||
          entry.name === "drizzle" || entry.name === "prisma" || entry.name === "scripts" ||
          entry.name === "strategies" || entry.name === "orchestrator" || entry.name === "dashboard" ||
          entry.name === "hooks" || entry.name === "assets" || entry.name === "constants" ||
          entry.name === "android" || entry.name === "ios"
        ) {
          queue.push({ dir: full, depth: depth + 1 });
        }
        continue;
      }

      try {
        const stat = await fs.promises.stat(full);
        sizeBytes += stat.size;
        if (!lastModified || stat.mtime > lastModified) lastModified = stat.mtime;
      } catch {
        continue;
      }

      files.push(rel);
      const base = entry.name.toLowerCase();

      if (base === ".git" || entry.name === ".git") hasGit = true;
      if (base.startsWith("readme")) {
        hasReadme = true;
        if (!readmeExcerpt) {
          try {
            const buf = await fs.promises.readFile(full, "utf8");
            readmeExcerpt = buf.slice(0, 2000);
          } catch {
            // ignore
          }
        }
      }
      if (base === ".env" || base === ".env.example" || base === ".env.local" || base.startsWith(".env.")) hasEnv = true;
      if (base.includes("test") || base.includes("spec")) hasTests = true;
      if (base === "dockerfile" || base.startsWith("docker-compose")) hasDocker = true;
      if (rel.includes(".github/workflows/") && (base.endsWith(".yml") || base.endsWith(".yaml"))) hasCi = true;
      if (base.includes("deploy") && (base.endsWith(".md") || base.endsWith(".guide"))) hasDeployGuide = true;
      if (base === "dist" || base === "build" || base === "out" || base === ".next" || base === ".expo") hasBuildArtifacts = true;

      if (entry.name === "package.json" && !packageJson) {
        try {
          const buf = await fs.promises.readFile(full, "utf8");
          const parsed = JSON.parse(buf);
          packageJson = { name: parsed.name, description: parsed.description };
        } catch {
          // ignore
        }
      }
    }
  }

  const name = packageJson?.name || path.basename(root);
  return {
    root,
    name,
    files,
    sizeBytes,
    hasGit,
    hasReadme,
    hasEnv,
    hasTests,
    hasDocker,
    hasCi,
    hasDeployGuide,
    hasBuildArtifacts,
    readmeExcerpt,
    lastModified,
    packageJson,
  };
}

export function buildProjectModel(
  raw: RawProjectCandidate,
  source: ProjectSource
): Project {
  const stack = detectStack(raw.files);
  const category = detectCategory({
    name: raw.name,
    slug: slugify(raw.name),
    stack,
    readmeExcerpt: raw.readmeExcerpt,
  });

  const completionScore = scoreCompletion({
    hasReadme: raw.hasReadme,
    hasTests: raw.hasTests,
    hasDocker: raw.hasDocker,
    hasCi: raw.hasCi,
    hasDeployGuide: raw.hasDeployGuide,
    hasGit: raw.hasGit,
    hasBuildArtifacts: raw.hasBuildArtifacts,
    stack,
    fileCount: raw.files.length,
  });

  const deployScore = scoreDeployReadiness({
    hasDocker: raw.hasDocker,
    hasCi: raw.hasCi,
    hasDeployGuide: raw.hasDeployGuide,
    hasEnv: raw.hasEnv,
    hasBuildArtifacts: raw.hasBuildArtifacts,
    stack,
  });

  const healthScore = scoreHealth({
    hasGit: raw.hasGit,
    hasReadme: raw.hasReadme,
    hasTests: raw.hasTests,
    fileCount: raw.files.length,
    stack,
    lastModified: raw.lastModified?.toISOString() ?? null,
    sizeBytes: raw.sizeBytes,
  });

  const composite = compositeScore(completionScore, deployScore, healthScore);

  const slug = slugify(raw.name);
  const id = crypto.createHash("sha1").update(raw.root).digest("hex").slice(0, 16);

  const now = new Date().toISOString();

  return {
    id,
    slug,
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
    firstSeen: now,
    completionScore,
    deployScore,
    healthScore,
    compositeScore: composite,
    status: "active",
    notes: null,
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s*\(?\d+\)?$/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
