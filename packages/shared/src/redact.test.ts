import { describe, it, expect } from "vitest";
import { redactSecrets } from "./redact.js";

describe("redaction", () => {
  it("redacts OpenAI keys", () => {
    const r = redactSecrets("here is sk-proj-abcdefghijklmnopqrstuvwxyz1234 ok?");
    expect(r.text).toContain("[REDACTED:openai-key]");
    expect(r.text).not.toContain("sk-proj-abcdef");
  });

  it("redacts GitHub tokens", () => {
    const r = redactSecrets("token: ghp_abcdefghijklmnopqrstuvwxyz0123456789");
    expect(r.text).toContain("[REDACTED:github-token]");
  });

  it("redacts private key blocks", () => {
    const r = redactSecrets("begin\n-----BEGIN RSA PRIVATE KEY-----\nABC\n-----END RSA PRIVATE KEY-----\nend");
    expect(r.text).toContain("[REDACTED:private-key-block]");
    expect(r.text).not.toContain("BEGIN RSA");
  });

  it("leaves benign text alone", () => {
    const r = redactSecrets("hello world");
    expect(r.text).toBe("hello world");
    expect(r.redactions).toEqual([]);
  });

  it("redacts generic API key patterns", () => {
    const r = redactSecrets('api_key = "abcdefghijklmnop1234"');
    expect(r.text).toContain("[REDACTED:generic-api-key]");
  });

  it("redacts github_pat_ tokens", () => {
    const r = redactSecrets("token: github_pat_11ABCDEFG_abcdefghijklmnopqrstuvwxyz1234567890");
    expect(r.text).toContain("[REDACTED:github-pat]");
  });

  it("redacts ethereum addresses", () => {
    const r = redactSecrets("send to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0 please");
    expect(r.text).toContain("[REDACTED:wallet-address]");
    expect(r.text).not.toContain("0x742d35Cc");
  });

  it("redacts bitcoin addresses", () => {
    const r = redactSecrets("btc: 1BoatSLRHtKNngkdXEeobR76b53LETtpyT");
    expect(r.text).toContain("[REDACTED:wallet-address]");
  });

  it("redacts mnemonic-file patterns (non-BIP39-length)", () => {
    // Use a 3-word "passphrase" — short enough that the BIP39 seed-phrase
    // pattern doesn't fire first.
    const r = redactSecrets('mnemonic = "satoshi nakamoto bitcoin"');
    expect(r.text).toContain("[REDACTED:mnemonic-file]");
  });

  it("redacts private-key-blocks (header form)", () => {
    const r = redactSecrets("-----BEGIN RSA PRIVATE KEY-----\nABC\n-----END RSA PRIVATE KEY-----");
    expect(r.text).toContain("[REDACTED:private-key-block]");
  });
});
