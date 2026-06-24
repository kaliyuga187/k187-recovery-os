import { PrismaClient } from "@prisma/client";
import path from "node:path";
import fs from "node:fs";

function resolveDbPath(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.startsWith("file:")) {
    const raw = envUrl.slice("file:".length);
    // Make absolute, relative to the workspace root (or cwd if absolute).
    if (path.isAbsolute(raw)) return raw;
    let dir = process.cwd();
    for (let i = 0; i < 6; i++) {
      if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) break;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    const target = path.resolve(dir, raw);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    process.env.DATABASE_URL = `file:${target}`;
    console.log(`[k187/db] resolved DB to: ${target}`);
    return target;
  }
  // Walk up from cwd to find the workspace root (where pnpm-workspace.yaml lives).
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) break;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const target = path.join(dir, "data", "k187.db");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  process.env.DATABASE_URL = `file:${target}`;
  console.log(`[k187/db] resolved DB to: ${target}`);
  return target;
}

resolveDbPath();

declare global {
  // eslint-disable-next-line no-var
  var __k187Prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__k187Prisma ??
  new PrismaClient({
    log: process.env.K187_DB_LOG === "1" ? ["query", "warn", "error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__k187Prisma = prisma;
}

export async function ensureSchema(): Promise<void> {
  // SQLite + Prisma; the user runs `pnpm db:push` to create tables.
  // We just sanity-check connectivity here.
  await prisma.$queryRaw`SELECT 1`;
}
