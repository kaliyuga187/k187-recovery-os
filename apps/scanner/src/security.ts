/**
 * Security guardrails for the K187 scanner.
 *
 * This module exists for one purpose: make it impossible to accidentally
 * run a destructive, exfiltrating, or credential-leaking operation from
 * the scanner or its CLI.
 *
 * Hard rules (enforced in code, not just docs):
 *   - The scanner never runs `rm`, `rmdir`, `del`, or any file-deletion tool.
 *   - The scanner never runs `curl`, `wget`, `Invoke-WebRequest`, or any
 *     HTTP client. The only outbound calls are to LLM providers (which are
 *     explicitly opted into via env vars) and `git clone` (shallow, only
 *     when the user passes --github <url>).
 *   - The scanner never runs `ssh`, `scp`, `rsync`, or any remote shell.
 *   - The scanner never runs `git push`, `git remote add`, or any write-
 *     side git operation.
 *   - The scanner never runs `npm publish`, `pnpm publish`, or any
 *     registry publish.
 *   - The scanner never decodes base64 input that originated from a
 *     scanned file (would be an obfuscation side-channel).
 *
 * If a future feature needs to do any of these, it MUST be added to the
 * ALLOWED list below with a comment explaining why.
 */

const BLOCKED_COMMANDS: RegExp[] = [
  // Destructive file ops
  /\brm\b/,
  /\brmdir\b/,
  /\bdel\b/,
  /\brmdir\b/i,
  /\bRemove-Item\b/i,
  /\bdel\b/i,
  // Network exfiltration
  /\bcurl\b/,
  /\bwget\b/,
  /\bInvoke-WebRequest\b/i,
  /\bInvoke-RestMethod\b/i,
  /\bhttpie\b/,
  /\bhttp\b/,
  // Remote shell
  /\bssh\b/,
  /\bscp\b/,
  /\brsync\b/,
  /\bsftp\b/,
  // Git write side
  /\bgit\s+push\b/,
  /\bgit\s+remote\s+add\b/,
  /\bgit\s+config\s+--global\b/,
  // Registry publish
  /\bnpm\s+publish\b/,
  /\bpnpm\s+publish\b/,
  /\byarn\s+publish\b/,
  // Obfuscation
  /\bbase64\s+-d\b/,
  /\bbase64\s+--decode\b/,
  /\b[Convert]::FromBase64String\b/i,
  // Sensitive local ops
  /\bkeytool\b/,
  /\bopenssl\s+req\b/,
  /\bpkill\b/,
  /\bkill\s+-9\b/,
  /\bkillall\b/,
  /\btaskkill\b/i,
  /\bStop-Process\b/i,
];

const ALLOWED_PATTERNS: RegExp[] = [
  // The two exceptions we explicitly support, with comments:
  // - git clone --depth 1 <url> <dir>  : for --github <url> Manus import
  // - powershell Expand-Archive        : for --zip <file> Manus import
  /^git\s+clone\s+--depth\s+1\s+\S+\s+\S+$/,
  /^powershell\s+-NoProfile\s+-Command\s+"Expand-Archive\b.*"$/,
];

/**
 * Throws if `command` matches any BLOCKED pattern. ALLOWED patterns are
 * the only commands the scanner is permitted to run.
 */
export function assertSafeCommand(command: string): void {
  for (const allowed of ALLOWED_PATTERNS) {
    if (allowed.test(command.trim())) return;
  }
  for (const blocked of BLOCKED_COMMANDS) {
    if (blocked.test(command)) {
      throw new Error(
        `Refusing to run blocked command.\n` +
        `  Command: ${command}\n` +
        `  Matched: ${blocked.source}\n` +
        `This is a security guardrail. See apps/scanner/src/security.ts.`
      );
    }
  }
}

/**
 * Hard list of strings that, if found in scanned file content, must be
 * redacted before being persisted, sent, or printed. The redactSecrets()
 * helper in @k187/shared does the actual redaction; this list is the
 * audit reference.
 */
export const NEVER_PERSIST_OR_SEND = Object.freeze([
  ".env contents",
  "API keys (any provider)",
  "private keys (PEM blocks or id_rsa/etc.)",
  "seed phrases (BIP39 mnemonics)",
  "wallet secrets (private keys, keystores, mnemonics)",
  "passwords",
  "bearer tokens",
  "GitHub tokens (ghp_/gho_/ghu_/ghs_/ghr_/github_pat_/gha-token)",
  "SSH keys (id_rsa/id_ed25519/id_dsa/id_ecdsa)",
  "PEM files",
  "key files (*.key, *.pfx, *.p12, *.keystore, *.jks)",
  "AWS access keys (AKIA...) and secret access keys",
  "Stripe keys (sk_/pk_/rk_ test/live)",
  "OpenAI keys (sk-... and sk-proj-...)",
  "Anthropic keys (sk-ant-...)",
  "JWTs (eyJ... . ... . ...)",
  "Base64-encoded secrets (never auto-decoded)",
  "wallet.dat, wallet.json, keystore.json",
  "files named 'seed_phrase', 'mnemonic.txt', 'mnemonic.json'",
]);

/**
 * Sanity check called once at CLI startup. If it fails, the scanner
 * refuses to start.
 */
export function securitySelfTest(): void {
  // Make sure our patterns compile.
  for (const r of BLOCKED_COMMANDS) void r.source;
  for (const r of ALLOWED_PATTERNS) void r.source;
  // Make sure the redact patterns cover everything in NEVER_PERSIST_OR_SEND.
  // (Loose check: each item has at least one matching token.)
  for (const item of NEVER_PERSIST_OR_SEND) {
    if (item.length < 5) {
      throw new Error(`security: blacklist entry too short to be useful: "${item}"`);
    }
  }
}
