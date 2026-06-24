export type StackSignal = {
  match: RegExp;
  label: string;
};

export const STACK_SIGNALS: StackSignal[] = [
  { match: /package\.json$/i, label: "node" },
  { match: /pnpm-lock\.yaml$/i, label: "pnpm" },
  { match: /yarn\.lock$/i, label: "yarn" },
  { match: /package-lock\.json$/i, label: "npm" },
  { match: /requirements\.txt$/i, label: "python" },
  { match: /Pipfile$/i, label: "python-pipenv" },
  { match: /pyproject\.toml$/i, label: "python-pyproject" },
  { match: /Cargo\.toml$/i, label: "rust" },
  { match: /go\.mod$/i, label: "go" },
  { match: /Gemfile$/i, label: "ruby" },
  { match: /composer\.json$/i, label: "php" },
  { match: /next\.config\.(js|ts|mjs)$/i, label: "nextjs" },
  { match: /vite\.config\.(js|ts|mjs)$/i, label: "vite" },
  { match: /nuxt\.config\.(js|ts|mjs)$/i, label: "nuxt" },
  { match: /remix\.config\.(js|ts)$/i, label: "remix" },
  { match: /svelte\.config\.(js|ts)$/i, label: "sveltekit" },
  { match: /astro\.config\.(js|ts|mjs)$/i, label: "astro" },
  { match: /angular\.json$/i, label: "angular" },
  { match: /^tsconfig\.json$/i, label: "typescript" },
  { match: /tailwind\.config\.(js|ts)$/i, label: "tailwind" },
  { match: /postcss\.config\.(js|cjs)$/i, label: "postcss" },
  { match: /drizzle\.config\.(js|ts)$/i, label: "drizzle" },
  { match: /prisma\/schema\.prisma$/i, label: "prisma" },
  { match: /Dockerfile$/i, label: "docker" },
  { match: /docker-compose\.ya?ml$/i, label: "docker-compose" },
  { match: /\.github\/workflows\//i, label: "github-actions" },
  { match: /app\.config\.ts$/i, label: "expo" },
  { match: /eas\.json$/i, label: "expo-eas" },
  { match: /android\//i, label: "android" },
  { match: /ios\//i, label: "ios" },
  { match: /metro\.config\.js$/i, label: "react-native" },
  { match: /jest\.config\.(js|ts)$/i, label: "jest" },
  { match: /vitest\.config\.(js|ts)$/i, label: "vitest" },
  { match: /playwright\.config\.(js|ts)$/i, label: "playwright" },
  { match: /\.eslintrc/i, label: "eslint" },
  { match: /prettier\.config/i, label: "prettier" },
];

export function detectStack(files: string[]): string[] {
  const labels = new Set<string>();
  for (const file of files) {
    for (const signal of STACK_SIGNALS) {
      if (signal.match.test(file)) {
        labels.add(signal.label);
      }
    }
  }
  return [...labels].sort();
}
