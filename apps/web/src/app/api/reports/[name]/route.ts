import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function reportsDir(): string {
  // Prefer .operator/reports (new canonical location), fall back to /reports.
  const op = path.resolve(process.cwd(), "..", "..", ".operator", "reports");
  const legacy = path.resolve(process.cwd(), "..", "..", "reports");
  if (fs.existsSync(op)) return op;
  if (fs.existsSync(legacy)) return legacy;
  return op;
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (name.includes("/") || name.includes("..")) {
    return new NextResponse("forbidden", { status: 403 });
  }
  const file = path.join(reportsDir(), name);
  if (!fs.existsSync(file)) return new NextResponse("not found", { status: 404 });
  const buf = await fs.promises.readFile(file, "utf8");
  return new NextResponse(buf, {
    status: 200,
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
