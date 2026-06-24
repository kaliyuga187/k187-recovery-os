import { listProjects } from "@/lib/reports";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listProjects();
  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-muted text-sm">{projects.length} indexed</p>
        </div>
        <div className="text-xs text-muted">Sorted by composite score</div>
      </header>
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="text-left py-2">Name</th>
              <th>Category</th>
              <th>Source</th>
              <th>Composite</th>
              <th>Comp.</th>
              <th>Deploy</th>
              <th>Health</th>
              <th>Files</th>
              <th>Stack</th>
              <th>Last edit</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="py-2">
                  <div className="font-mono">{p.slug}</div>
                  <div className="text-xs text-muted truncate max-w-[280px]">{p.path}</div>
                </td>
                <td className="text-center"><span className="pill">{p.category}</span></td>
                <td className="text-center"><span className="pill">{p.source}</span></td>
                <td className="text-center font-semibold">{p.compositeScore}</td>
                <td className="text-center">{p.completionScore}</td>
                <td className="text-center">{p.deployScore}</td>
                <td className="text-center">{p.healthScore}</td>
                <td className="text-center text-xs text-muted">{p.fileCount}</td>
                <td className="text-center text-xs text-muted max-w-[200px] truncate">{p.stack.slice(0, 5).join(", ")}</td>
                <td className="text-center text-xs text-muted">{p.lastModified ? p.lastModified.slice(0, 10) : "—"}</td>
                <td className="text-right"><Link className="btn" href={`/projects/${p.slug}`}>open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
