export type ProjectStatus = "active" | "paused" | "complete" | "abandoned" | "stuck";

export type ProjectCategory =
  | "web-app"
  | "mobile-app"
  | "trading-bot"
  | "dashboard"
  | "ai-agent"
  | "cli"
  | "library"
  | "infra"
  | "design"
  | "monetization"
  | "unknown";

export type ProjectSource = "local" | "github" | "zip" | "imported";

export type ManusImportStatus = "pending" | "imported" | "duplicate" | "failed" | "ignored";

export interface Project {
  id: string;
  slug: string;
  name: string;
  path: string;
  source: ProjectSource;
  category: ProjectCategory;
  stack: string[];
  description: string | null;
  sizeBytes: number;
  fileCount: number;
  hasGit: boolean;
  hasReadme: boolean;
  hasEnv: boolean;
  hasTests: boolean;
  hasDocker: boolean;
  hasCi: boolean;
  hasDeployGuide: boolean;
  hasBuildArtifacts: boolean;
  lastModified: string | null;
  firstSeen: string;
  completionScore: number;
  deployScore: number;
  healthScore: number;
  compositeScore: number;
  status: ProjectStatus;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DuplicateGroup {
  id: string;
  fingerprint: string;
  projects: Project[];
  recommendation: "keep" | "merge" | "archive";
  reason: string;
}

export interface ScanResult {
  rootPath: string;
  scannedAt: string;
  durationMs: number;
  projectsFound: number;
  errors: ScanError[];
}

export interface ScanError {
  path: string;
  message: string;
}

export interface ManusProject {
  uuid: string;
  name: string;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  status: string | null;
  raw: Record<string, unknown>;
}

export interface AIAnalysis {
  projectId: string;
  modelUsed: string;
  summary: string;
  recommendedAction: "finish" | "polish" | "deploy" | "monetize" | "expand" | "archive" | "ignore";
  rationale: string;
  nextSteps: string[];
  risks: string[];
  generatedAt: string;
}

export interface ActiveBuild {
  projectId: string;
  setAt: string;
  reason: string | null;
}

export interface WeeklyReport {
  generatedAt: string;
  topComplete: Project[];
  topStuck: Project[];
  topDuplicates: DuplicateGroup[];
  focusPick: Project | null;
  ignorePick: Project | null;
  totals: {
    totalProjects: number;
    totalDuplicates: number;
    averageCompletion: number;
    activeBuild: Project | null;
  };
}
