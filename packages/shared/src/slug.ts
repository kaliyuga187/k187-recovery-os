export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s*\(?\d+\)?$/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
