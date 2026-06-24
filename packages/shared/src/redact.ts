/**
 * Redact secrets before any text is sent to an LLM, stored in a report,
 * or committed to git. Conservative: when in doubt, redact.
 */

const SECRET_PATTERNS: Array<{ name: string; re: RegExp }> = [
  // Generic key= patterns must run BEFORE more specific patterns so that
  // a labelled "mnemonic = ..." or "seed = ..." is caught by the
  // mnemonic-file rule instead of the BIP39 seed-phrase rule.
  // Match: mnemonic|seed|passphrase [=:] "value"  or  = bareword
  // where value is a quoted string (allowing spaces) or an unquoted run
  // of non-whitespace chars.
  { name: "mnemonic-file", re: /\b(?:mnemonic|seed|passphrase)\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;}{)\]"'`]{8,})/gi },
  // ---- platform/provider-specific keys ----
  { name: "openai-key", re: /sk-(?:proj-)?[A-Za-z0-9_\-]{20,}/g },
  { name: "anthropic-key", re: /sk-ant-(?:api\d-)?[A-Za-z0-9_\-]{20,}/g },
  { name: "github-token", re: /gh[pousr]_[A-Za-z0-9]{30,}/g },
  { name: "github-pat", re: /github_pat_[A-Za-z0-9_]{20,}/g },
  { name: "stripe-key", re: /(?:sk|pk|rk)_(?:test|live)_[A-Za-z0-9]{16,}/g },
  { name: "aws-access-key", re: /AKIA[0-9A-Z]{16}/g },
  { name: "aws-secret-key", re: /(?:aws_)?secret(?:_access)?_key\s*[:=]\s*['"]?[A-Za-z0-9/+=]{40}['"]?/gi },
  { name: "private-key-block", re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/g },
  { name: "seed-phrase", re: /\b(?:[a-z]{3,12}\s+){11,23}[a-z]{3,12}\b/gi },
  { name: "jwt", re: /eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}/g },
  { name: "bearer-token", re: /Bearer\s+[A-Za-z0-9_\-\.=]{20,}/gi },
  { name: "generic-api-key", re: /(?:api[_-]?key|apikey|token|secret|password|passwd|pwd)\s*[:=]\s*['"]?[A-Za-z0-9_\-\.]{16,}['"]?/gi },
  { name: "wallet-address", re: /\b(?:0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{20,})\b/g },
];

export interface RedactionResult {
  text: string;
  redactions: Array<{ name: string; count: number }>;
}

export function redactSecrets(input: string): RedactionResult {
  let text = input;
  const redactions: Array<{ name: string; count: number }> = [];

  for (const { name, re } of SECRET_PATTERNS) {
    const before = text.length;
    text = text.replace(re, `[REDACTED:${name}]`);
    if (text.length !== before) {
      redactions.push({ name, count: 1 });
    }
  }

  return { text, redactions };
}

export function redactSecretsInObject<T>(obj: T): T {
  const json = JSON.stringify(obj);
  const { text } = redactSecrets(json);
  return JSON.parse(text) as T;
}

export function redactStringArray(arr: string[]): string[] {
  return arr.map((s) => redactSecrets(s).text);
}
