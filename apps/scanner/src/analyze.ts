import { prisma } from "@k187/db";
import { findProjectBySlug, listProjects } from "./reports.js";
import { getProvider } from "@k187/ai";
import { redactSecrets, redactStringArray } from "@k187/shared";

export async function analyzeLongContext(opts: { slug?: string; all?: boolean }) {
  const provider = getProvider();
  const targets = [];

  if (opts.all) {
    targets.push(...(await listProjects()));
  } else if (opts.slug) {
    const p = await findProjectBySlug(opts.slug);
    if (!p) throw new Error(`Project not found: ${opts.slug}`);
    targets.push(p);
  } else {
    throw new Error("Pass either --project <slug> or --all");
  }

  for (const p of targets) {
    console.log(`Analyzing: ${p.slug} (${p.name})...`);
    const { parsed, modelUsed, rawText } = await provider.analyze({ projects: [p] });

    // defense in depth: redact before persisting
    const summary = redactSecrets(parsed.summary).text;
    const rationale = redactSecrets(parsed.rationale).text;
    const nextSteps = redactStringArray(parsed.nextSteps);
    const risks = redactStringArray(parsed.risks);

    await prisma.aIAnalysis.create({
      data: {
        projectId: p.id,
        modelUsed,
        summary,
        recommendedAction: parsed.recommendedAction,
        rationale,
        nextSteps: JSON.stringify(nextSteps),
        risks: JSON.stringify(risks),
      },
    });
    console.log(`  -> ${parsed.recommendedAction}: ${parsed.summary.slice(0, 100)}...`);
  }
}
