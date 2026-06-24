import type { Project, ProjectCategory } from "./types.js";

const NAME_CATEGORY_RULES: Array<{ match: RegExp; category: ProjectCategory }> = [
  { match: /(trade|trading|bot|edge|whale|polybot|polymarket|apex-trading)/i, category: "trading-bot" },
  { match: /(mobile|expo|react-native|native|android|ios)/i, category: "mobile-app" },
  { match: /(dashboard|admin|console|panel|hub|command-center)/i, category: "dashboard" },
  { match: /(agent|crew|orchestrat|pipeline)/i, category: "ai-agent" },
  { match: /(store|web-store|shop|commerce)/i, category: "web-app" },
  { match: /(cli|scanner|scanner-cli)/i, category: "cli" },
  { match: /(lib|library|sdk|package)/i, category: "library" },
  { match: /(infra|vps|deploy|docker|kubernetes|terraform)/i, category: "infra" },
  { match: /(design|figma|sketch|mockup|wireframe)/i, category: "design" },
  { match: /(monetiz|subscription|stripe|payment|monetization-roadmap)/i, category: "monetization" },
];

const STACK_CATEGORY_RULES: Array<{ any: string[]; category: ProjectCategory }> = [
  { any: ["expo", "expo-eas", "react-native", "android", "ios"], category: "mobile-app" },
  { any: ["nextjs", "vite", "nuxt", "remix", "sveltekit", "astro", "angular"], category: "web-app" },
  { any: ["docker-compose", "docker"], category: "infra" },
];

const README_CATEGORY_RULES: Array<{ match: RegExp; category: ProjectCategory }> = [
  { match: /polymarket|trading|whale|edge|bot/i, category: "trading-bot" },
  { match: /expo|react native|mobile|android|ios/i, category: "mobile-app" },
  { match: /dashboard|admin|command center/i, category: "dashboard" },
  { match: /agent|orchestrat|memecoin|meme-agent|memerizzle/i, category: "ai-agent" },
  { match: /monetiz|stripe|subscription/i, category: "monetization" },
];

export function detectCategory(input: {
  name: string;
  slug: string;
  stack: string[];
  readmeExcerpt: string;
}): ProjectCategory {
  const haystack = `${input.name} ${input.slug}`;

  for (const rule of NAME_CATEGORY_RULES) {
    if (rule.match.test(haystack)) return rule.category;
  }

  for (const rule of STACK_CATEGORY_RULES) {
    if (rule.any.some((s) => input.stack.includes(s))) return rule.category;
  }

  for (const rule of README_CATEGORY_RULES) {
    if (rule.match.test(input.readmeExcerpt)) return rule.category;
  }

  return "unknown";
}
