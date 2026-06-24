import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export const dynamic = "force-dynamic";

const SKILLS = [
  "build-recovery",
  "adhd-build-assistant",
  "claude-code-delegator",
  "minimax-long-context-review",
  "weekly-build-report",
];

function skillsDir(): string {
  if (process.env.HERMES_HOME) return path.join(process.env.HERMES_HOME, "skills");
  return path.join(os.homedir(), "AppData", "Local", "hermes", "skills");
}

export default async function HermesPage() {
  const dir = skillsDir();
  const present: Array<{ name: string; exists: boolean; excerpt: string }> = [];
  for (const name of SKILLS) {
    const file = path.join(dir, name, "SKILL.md");
    if (fs.existsSync(file)) {
      const buf = fs.readFileSync(file, "utf8");
      present.push({ name, exists: true, excerpt: buf.split("\n").slice(0, 8).join("\n") });
    } else {
      present.push({ name, exists: false, excerpt: "" });
    }
  }
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Hermes skills</h1>
        <p className="text-muted text-sm">
          The 6 K187 skills are generated into <code>{dir}</code>.
          Run <code className="text-accent">pnpm hermes:skills</code> from the workspace root to (re)install them.
        </p>
      </header>
      <div className="space-y-3">
        {present.map((s) => (
          <div key={s.name} className="panel">
            <div className="flex items-center justify-between">
              <div className="font-mono">{s.name}</div>
              <span className={`pill ${s.exists ? "text-success" : "text-warn"}`}>{s.exists ? "installed" : "missing"}</span>
            </div>
            {s.exists && (
              <pre className="text-xs text-muted mt-2 overflow-x-auto whitespace-pre-wrap">{s.excerpt}</pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
