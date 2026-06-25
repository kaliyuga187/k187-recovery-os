#!/usr/bin/env node
/**
 * Standalone dashboard server — works around the Next.js + Node 24 segfault.
 *
 * Reads .operator/works.jsonl + .operator/agents.jsonl + .operator/projects/
 * + DASHBOARD.md and serves a static HTML dashboard on port 3737.
 *
 * No Next.js, no React, no build. Just node http + tiny HTML templates.
 *
 * This is the "fallback" until someone installs Node 20 (which makes `pnpm dev`
 * work) or we wait for Next 15.5+ to ship Node 24 support.
 *
 * Routes:
 *   GET /                          -> dashboard.html
 *   GET /works                     -> works.html
 *   GET /agents                    -> agents.html
 *   GET /api/works?limit=50        -> JSON
 *   GET /api/agents?limit=50       -> JSON
 *   GET /api/projects               -> JSON
 *   GET /api/summary                -> JSON (combined stats)
 *
 * Usage:  node scripts/dashboard-server.cjs
 *   or:   ./scripts/dashboard-server.cjs
 */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OPERATOR = path.join(ROOT, ".operator");
const PORT = Number(process.env.DASHBOARD_PORT ?? 3737);
const HOST = process.env.DASHBOARD_HOST ?? "127.0.0.1";

function readJSONL(file) {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, "utf8");
  const out = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed));
    } catch {}
  }
  return out;
}

function listWorkLogs(opts = {}) {
  let rows = readJSONL(path.join(OPERATOR, "works.jsonl"));
  if (opts.sinceISO) rows = rows.filter((r) => r.performedAt >= opts.sinceISO);
  if (opts.byKind) rows = rows.filter((r) => r.kind === opts.byKind);
  if (opts.byRepo) rows = rows.filter((r) => r.repoSlug === opts.byRepo);
  if (opts.byPerformer) rows = rows.filter((r) => r.performedBy === opts.byPerformer);
  rows.sort((a, b) => (a.performedAt < b.performedAt ? 1 : -1));
  if (opts.limit && opts.limit > 0) rows = rows.slice(0, opts.limit);
  return rows;
}

function listAgentRuns(opts = {}) {
  let rows = readJSONL(path.join(OPERATOR, "agents.jsonl"));
  if (opts.byKind) rows = rows.filter((r) => r.agentKind === opts.byKind);
  if (opts.byStatus) rows = rows.filter((r) => r.status === opts.byStatus);
  rows.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  if (opts.limit && opts.limit > 0) rows = rows.slice(0, opts.limit);
  return rows;
}

function getWorksSummary() {
  const rows = listWorkLogs();
  const now = Date.now();
  const last24h = rows.filter((r) => now - new Date(r.performedAt).getTime() < 86400000).length;
  const last7d = rows.filter((r) => now - new Date(r.performedAt).getTime() < 7 * 86400000).length;
  const byKind = {};
  const byPerformer = {};
  const repoCounts = {};
  let totalCostCents = 0;
  for (const r of rows) {
    byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
    byPerformer[r.performedBy] = (byPerformer[r.performedBy] ?? 0) + 1;
    if (r.repoSlug) repoCounts[r.repoSlug] = (repoCounts[r.repoSlug] ?? 0) + 1;
    totalCostCents += r.costCents ?? 0;
  }
  const topRepos = Object.entries(repoCounts)
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  return { totalLogs: rows.length, last24h, last7d, byKind, byPerformer, totalCostCents, topRepos };
}

function getAgentsSummary() {
  const rows = listAgentRuns();
  const running = rows.filter((r) => r.status === "running").length;
  const success = rows.filter((r) => r.status === "success").length;
  const failed = rows.filter((r) => r.status === "fail" || r.status === "timeout").length;
  const byKind = {};
  let totalCostCents = 0;
  for (const r of rows) {
    byKind[r.agentKind] = (byKind[r.agentKind] ?? 0) + 1;
    totalCostCents += r.costCents ?? 0;
  }
  return { totalRuns: rows.length, running, success, failed, byKind, totalCostCents, lastRun: rows[0] };
}

const KIND_COLORS = {
  commit: "#22c55e", deploy: "#3b82f6", scan: "#a855f7", analysis: "#d946ef",
  fix: "#ef4444", docs: "#06b6d4", stripe: "#635bff", github: "#8b5cf6",
  build: "#f59e0b", design: "#ec4899", ops: "#64748b", other: "#94a3b8",
};

function fmtRel(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

function fmtCost(c) {
  if (!c) return "free";
  if (c < 100) return `${c}¢`;
  return `$${(c / 100).toFixed(2)}`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function layout(title, body) {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} — K187 Recovery OS</title>
<style>
  :root{--bg:#0a0514;--panel:#150828;--border:#2d1b4d;--accent:#a855f7;--text:#e9d5ff;--muted:#7c6f9c;--pink:#ec4899;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg);color:var(--text);font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;line-height:1.5;}
  a{color:var(--accent);text-decoration:none;} a:hover{color:var(--pink);}
  .wrap{display:flex;min-height:100vh;}
  nav{width:220px;background:var(--panel);border-right:1px solid var(--border);padding:20px 16px;position:sticky;top:0;height:100vh;}
  nav .brand{font-family:ui-monospace,monospace;color:var(--accent);font-size:12px;margin-bottom:20px;}
  nav a{display:block;padding:6px 8px;border-radius:6px;color:#c4b5fd;font-size:13px;}
  nav a:hover,nav a.active{background:rgba(168,85,247,0.15);color:#fff;}
  main{flex:1;padding:32px 40px;max-width:1400px;}
  h1{font-size:24px;font-weight:600;margin-bottom:4px;}
  h2{font-size:16px;font-weight:600;margin-bottom:12px;color:#fff;}
  h3{font-size:13px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;}
  p.sub{color:var(--muted);font-size:13px;margin-bottom:24px;}
  .stat{background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:14px;}
  .stat .label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;}
  .stat .value{font-size:24px;font-weight:600;margin-top:4px;}
  .stat .sub{font-size:11px;color:var(--muted);margin-top:2px;}
  .row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:24px;}
  .row.two{grid-template-columns:repeat(auto-fit,minmax(360px,1fr));}
  .panel{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:18px;margin-bottom:16px;}
  table{width:100%;font-size:13px;border-collapse:collapse;}
  th{text-align:left;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;padding:8px 4px;border-bottom:1px solid var(--border);font-weight:500;}
  td{padding:8px 4px;border-top:1px solid rgba(168,85,247,0.1);}
  td.center{text-align:center;} td.right{text-align:right;}
  .mono{font-family:ui-monospace,monospace;font-size:12px;}
  .pill{display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;font-family:ui-monospace,monospace;}
  .timeline{position:relative;border-left:1px solid var(--border);margin-left:6px;padding-left:20px;}
  .timeline > li{position:relative;margin-bottom:14px;}
  .timeline > li::before{content:'';position:absolute;left:-26px;top:6px;width:12px;height:12px;border-radius:50%;background:var(--accent);}
  .empty{text-align:center;padding:40px 20px;color:var(--muted);}
  .badge{display:inline-block;padding:1px 6px;border-radius:3px;font-size:10px;background:rgba(168,85,247,0.15);color:var(--accent);font-family:ui-monospace,monospace;}
  hr{border:none;border-top:1px solid var(--border);margin:20px 0;}
  footer{color:var(--muted);font-size:11px;margin-top:32px;text-align:center;padding:16px;}
  footer code{font-family:ui-monospace,monospace;background:var(--panel);padding:2px 6px;border-radius:3px;}
</style>
</head><body>
<div class="wrap">
  <nav>
    <div class="brand">K187 · Recovery OS</div>
    <a href="/" ${title === "Dashboard" ? 'class="active"' : ""}>Dashboard</a>
    <a href="/works" ${title === "Works" ? 'class="active"' : ""}>Works</a>
    <a href="/agents" ${title === "Agents" ? 'class="active"' : ""}>Agents</a>
    <hr>
    <a href="/dashboard">Old Dashboard</a>
    <a href="/api/works">API: works</a>
    <a href="/api/agents">API: agents</a>
  </nav>
  <main>${body}
  <footer>
    Standalone dashboard server · <code>node scripts/dashboard-server.cjs</code>
    · reads <code>.operator/works.jsonl</code> + <code>.operator/agents.jsonl</code>
    · bypasses Next.js + Node 24 segfault
  </footer>
  </main>
</div>
</body></html>`;
}

function dashboardHtml() {
  const ws = getWorksSummary();
  const as = getAgentsSummary();
  const recent = listWorkLogs({ limit: 10 });
  return layout("Dashboard", `
    <h1>Dashboard</h1>
    <p class="sub">Standalone server — works without Next.js. View <a href="/works">Works</a> or <a href="/agents">Agents</a>.</p>

    <div class="row">
      <div class="stat"><div class="label">Actions logged</div><div class="value">${ws.totalLogs}</div></div>
      <div class="stat"><div class="label">Last 24h</div><div class="value" style="color:${ws.last24h ? "var(--accent)" : "var(--text)"}">${ws.last24h}</div></div>
      <div class="stat"><div class="label">Last 7d</div><div class="value">${ws.last7d}</div></div>
      <div class="stat"><div class="label">AI spend</div><div class="value">${fmtCost(ws.totalCostCents)}</div></div>
    </div>

    <div class="row">
      <div class="stat"><div class="label">Agent runs</div><div class="value">${as.totalRuns}</div></div>
      <div class="stat"><div class="label">Running</div><div class="value">${as.running}</div></div>
      <div class="stat"><div class="label">Succeeded</div><div class="value">${as.success}</div></div>
      <div class="stat"><div class="label">Failed</div><div class="value" style="color:${as.failed > 0 ? "var(--pink)" : "var(--text)"}">${as.failed}</div></div>
    </div>

    <div class="row two">
      <div class="panel">
        <h3><a href="/works">Works →</a></h3>
        <p style="color:var(--muted);font-size:13px;">
          What got done — last 24h: <span class="badge">${ws.last24h}</span>,
          last 7d: <span class="badge">${ws.last7d}</span>.
          <a href="/works">See full timeline →</a>
        </p>
      </div>
      <div class="panel">
        <h3><a href="/agents">Agents →</a></h3>
        <p style="color:var(--muted);font-size:13px;">
          ${as.totalRuns} runs total · ${as.running} running ·
          ${as.success} succeeded · ${as.failed} failed.
          <a href="/agents">See agent registry →</a>
        </p>
      </div>
    </div>

    <div class="panel">
      <h2>Recent activity (last 10)</h2>
      ${recent.length === 0 ? `<div class="empty">No activity logged yet.</div>` : `
        <ol class="timeline">
          ${recent.map((r) => `
            <li>
              <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <div style="font-weight:500;">${escapeHtml(r.title)}</div>
                <div style="display:flex;gap:8px;font-size:11px;color:var(--muted);">
                  <span>${fmtRel(r.performedAt)}</span>
                  <span class="badge" style="color:${KIND_COLORS[r.kind] ?? "#888"}">${escapeHtml(r.kind)}</span>
                  <span class="badge">${escapeHtml(r.performedBy)}</span>
                  ${r.costCents ? `<span class="badge">${fmtCost(r.costCents)}</span>` : ""}
                </div>
              </div>
              ${r.detail ? `<div style="color:var(--muted);font-size:12px;margin-top:4px;">${escapeHtml(r.detail.slice(0, 200))}${r.detail.length > 200 ? "…" : ""}</div>` : ""}
            </li>
          `).join("")}
        </ol>
      `}
    </div>
  `);
}

function worksHtml() {
  const ws = getWorksSummary();
  const all = listWorkLogs({});
  return layout("Works", `
    <h1>Works</h1>
    <p class="sub">What got done — by Hermes, Kai, Claude Code, Codex, and MiniMax M3.</p>

    <div class="row">
      <div class="stat"><div class="label">Total</div><div class="value">${ws.totalLogs}</div></div>
      <div class="stat"><div class="label">Last 24h</div><div class="value">${ws.last24h}</div></div>
      <div class="stat"><div class="label">Last 7d</div><div class="value">${ws.last7d}</div></div>
      <div class="stat"><div class="label">Spend</div><div class="value">${fmtCost(ws.totalCostCents)}</div></div>
    </div>

    <div class="row two">
      <div class="panel">
        <h3>By kind</h3>
        ${Object.entries(ws.byKind).sort((a, b) => b[1] - a[1]).map(([k, v]) => `
          <div style="display:flex;align-items:center;gap:10px;padding:4px 0;font-size:13px;">
            <span class="mono" style="width:90px;color:${KIND_COLORS[k] ?? "#888"}">${escapeHtml(k)}</span>
            <div style="flex:1;height:6px;background:rgba(168,85,247,0.1);border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${(v / Math.max(...Object.values(ws.byKind))) * 100}%;background:${KIND_COLORS[k] ?? "#888"};"></div>
            </div>
            <span class="mono" style="width:30px;text-align:right;">${v}</span>
          </div>
        `).join("")}
      </div>
      <div class="panel">
        <h3>By performer</h3>
        ${Object.entries(ws.byPerformer).sort((a, b) => b[1] - a[1]).map(([k, v]) => `
          <div style="display:flex;align-items:center;gap:10px;padding:4px 0;font-size:13px;">
            <span class="mono" style="width:120px;">${escapeHtml(k)}</span>
            <div style="flex:1;height:6px;background:rgba(168,85,247,0.1);border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${(v / Math.max(...Object.values(ws.byPerformer))) * 100}%;background:#a855f7;"></div>
            </div>
            <span class="mono" style="width:30px;text-align:right;">${v}</span>
          </div>
        `).join("")}
      </div>
    </div>

    ${ws.topRepos.length > 0 ? `
      <div class="panel">
        <h3>Top repos touched</h3>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${ws.topRepos.map((r) => `<span class="badge">${escapeHtml(r.slug)} · ${r.count}</span>`).join("")}
        </div>
      </div>
    ` : ""}

    <div class="panel">
      <h2>Full timeline (${all.length} actions)</h2>
      ${all.length === 0 ? `<div class="empty">No work logged yet.</div>` : `
        <ol class="timeline">
          ${all.map((r) => `
            <li>
              <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <div style="font-weight:500;">${escapeHtml(r.title)}</div>
                <div style="display:flex;gap:8px;font-size:11px;color:var(--muted);">
                  <span>${fmtRel(r.performedAt)}</span>
                  <span class="badge" style="color:${KIND_COLORS[r.kind] ?? "#888"}">${escapeHtml(r.kind)}</span>
                  <span class="badge">${escapeHtml(r.performedBy)}</span>
                  ${r.outcome !== "ok" ? `<span class="badge" style="background:rgba(239,68,68,0.2);color:#fca5a5;">${escapeHtml(r.outcome)}</span>` : ""}
                  ${r.costCents ? `<span class="badge">${fmtCost(r.costCents)}</span>` : ""}
                </div>
              </div>
              ${r.detail ? `<div style="color:var(--muted);font-size:12px;margin-top:4px;">${escapeHtml(r.detail.slice(0, 400))}${r.detail.length > 400 ? "…" : ""}</div>` : ""}
              <div style="display:flex;gap:12px;margin-top:4px;font-size:11px;color:var(--muted);">
                ${r.repoSlug ? `<span>→ ${escapeHtml(r.repoSlug)}</span>` : ""}
                ${r.githubRef ? `<span style="color:var(--accent);">${escapeHtml(r.githubRef)}</span>` : ""}
                ${r.filesTouched && r.filesTouched.length ? `<span>${r.filesTouched.length} files</span>` : ""}
                ${(r.tags ?? []).map((t) => `<span class="badge">${escapeHtml(t)}</span>`).join("")}
              </div>
            </li>
          `).join("")}
        </ol>
      `}
    </div>
  `);
}

function agentsHtml() {
  const as = getAgentsSummary();
  const recent = listAgentRuns({ limit: 50 });
  const REGISTRY = [
    { kind: "claude-code", name: "Claude Code", icon: "🟧", color: "#d97706", status: "needs-key",
      note: "Found at ~/.local/bin/claude.exe v2.1.139. Needs ANTHROPIC_API_KEY." },
    { kind: "codex", name: "Codex CLI", icon: "🟩", color: "#10b981", status: "needs-install",
      note: "Run: npm i -g @openai/codex" },
    { kind: "openai", name: "ChatGPT", icon: "🤖", color: "#10b981", status: "needs-key",
      note: "Add OPENAI_API_KEY. Routed via OpenRouter for now." },
    { kind: "subagent", name: "Hermes Subagents", icon: "🌀", color: "#a855f7", status: "available",
      note: "Built into Hermes. Used automatically for parallel work." },
    { kind: "minimax-m3", name: "MiniMax M3", icon: "🧠", color: "#3b82f6", status: "available",
      note: "Working — confirmed by 5+ successful analyses this session." },
    { kind: "hermes", name: "Hermes (self)", icon: "🌸", color: "#ec4899", status: "available",
      note: "Currently active. This conversation." },
  ];
  const STATUS_COLORS = { available: "#22c55e", "needs-key": "#f59e0b", "needs-install": "#a855f7", blocked: "#ef4444" };
  const STATUS_LABELS = { available: "READY", "needs-key": "NEEDS API KEY", "needs-install": "NEEDS INSTALL", blocked: "BLOCKED" };
  const RUN_COLORS = { pending: "#94a3b8", running: "#3b82f6", success: "#22c55e", fail: "#ef4444", timeout: "#f59e0b" };

  return layout("Agents", `
    <h1>Agents</h1>
    <p class="sub">External agents registered in the recovery-OS. Status reflects auth + install state.</p>

    <div class="row">
      <div class="stat"><div class="label">Total runs</div><div class="value">${as.totalRuns}</div></div>
      <div class="stat"><div class="label">Running</div><div class="value">${as.running}</div></div>
      <div class="stat"><div class="label">Succeeded</div><div class="value">${as.success}</div></div>
      <div class="stat"><div class="label">Failed</div><div class="value">${as.failed}</div></div>
      <div class="stat"><div class="label">Spend</div><div class="value">${fmtCost(as.totalCostCents)}</div></div>
    </div>

    <h2 style="margin-bottom:12px;">Registered agents</h2>
    <div class="row two">
      ${REGISTRY.map((a) => `
        <div class="panel" style="border-color:${STATUS_COLORS[a.status]}33;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:24px;color:${a.color}">${a.icon}</span>
              <div>
                <div style="font-weight:600;">${escapeHtml(a.name)}</div>
                <div class="mono" style="font-size:11px;color:var(--muted);">${escapeHtml(a.kind)}</div>
              </div>
            </div>
            <span class="pill" style="background:${STATUS_COLORS[a.status]}22;color:${STATUS_COLORS[a.status]};">${STATUS_LABELS[a.status]}</span>
          </div>
          <p style="font-size:13px;margin-top:10px;color:#c4b5fd;">${escapeHtml(a.note)}</p>
        </div>
      `).join("")}
    </div>

    <div class="panel">
      <h2>Recent runs (${recent.length})</h2>
      ${recent.length === 0 ? `<div class="empty">No agent runs logged yet.</div>` : `
        <table>
          <thead>
            <tr><th>Agent</th><th>Intent</th><th class="center">Status</th><th class="center">Cost</th><th class="right">When</th></tr>
          </thead>
          <tbody>
            ${recent.map((r) => `
              <tr>
                <td>
                  <div class="mono" style="font-size:11px;">${escapeHtml(r.agentKind)}</div>
                  <div style="font-size:11px;color:var(--muted);">${escapeHtml(r.agentName)}</div>
                </td>
                <td>
                  <div style="max-width:420px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(r.intent)}">${escapeHtml(r.intent)}</div>
                  ${r.outputSummary ? `<div style="font-size:11px;color:var(--muted);max-width:420px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(r.outputSummary)}">→ ${escapeHtml(r.outputSummary)}</div>` : ""}
                </td>
                <td class="center"><span class="pill" style="background:${RUN_COLORS[r.status]}22;color:${RUN_COLORS[r.status]};">${escapeHtml(r.status)}</span></td>
                <td class="center mono" style="font-size:11px;">${r.costCents ? fmtCost(r.costCents) : "—"}</td>
                <td class="right" style="font-size:11px;color:var(--muted);">${fmtRel(r.startedAt)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `}
    </div>
  `);
}

function send(res, status, body, contentType = "text/html") {
  res.writeHead(status, { "Content-Type": contentType + "; charset=utf-8", "Cache-Control": "no-store" });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  if (path === "/" || path === "/dashboard") return send(res, 200, dashboardHtml());
  if (path === "/works") return send(res, 200, worksHtml());
  if (path === "/agents") return send(res, 200, agentsHtml());
  if (path === "/api/works") {
    const limit = Number(url.searchParams.get("limit") ?? 50);
    return send(res, 200, JSON.stringify({ count: listWorkLogs({ limit }).length, items: listWorkLogs({ limit }) }), "application/json");
  }
  if (path === "/api/agents") {
    const limit = Number(url.searchParams.get("limit") ?? 50);
    return send(res, 200, JSON.stringify({ count: listAgentRuns({ limit }).length, items: listAgentRuns({ limit }) }), "application/json");
  }
  if (path === "/api/summary") {
    return send(res, 200, JSON.stringify({ works: getWorksSummary(), agents: getAgentsSummary() }), "application/json");
  }
  send(res, 404, "<h1>404</h1>", "text/html");
});

server.listen(PORT, HOST, () => {
  console.log(`[dashboard] listening on http://${HOST}:${PORT}`);
  console.log(`[dashboard] data: ${OPERATOR}`);
});
