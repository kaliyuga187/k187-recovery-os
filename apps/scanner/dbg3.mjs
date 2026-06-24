
import { writeFileSync } from "node:fs";
writeFileSync("C:/Users/nk187/k187-recovery-os/apps/scanner/SCRIPT-RAN.txt", "ran at " + new Date().toISOString() + "\n");
import { prisma } from "@k187/db";
writeFileSync("C:/Users/nk187/k187-recovery-os/apps/scanner/SCRIPT-RAN.txt", "after import at " + new Date().toISOString() + "\n", { flag: "a" });
try {
  (async () => {
    const n = await prisma.project.count();
    writeFileSync("C:/Users/nk187/k187-recovery-os/apps/scanner/SCRIPT-RAN.txt", "count=" + n + "\n", { flag: "a" });
  })();
} catch (e) {
  writeFileSync("C:/Users/nk187/k187-recovery-os/apps/scanner/SCRIPT-RAN.txt", "ERR: " + e.message + "\n", { flag: "a" });
}
writeFileSync("C:/Users/nk187/k187-recovery-os/apps/scanner/SCRIPT-RAN.txt", "end\n", { flag: "a" });
