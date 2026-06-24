import { describe, it, expect } from "vitest";
import { assertSafeCommand, securitySelfTest, NEVER_PERSIST_OR_SEND } from "./security.js";

describe("security guardrails", () => {
  it("self-test passes", () => {
    expect(() => securitySelfTest()).not.toThrow();
  });

  it("NEVER_PERSIST_OR_SEND is non-empty and frozen", () => {
    expect(NEVER_PERSIST_OR_SEND.length).toBeGreaterThan(5);
    expect(Object.isFrozen(NEVER_PERSIST_OR_SEND)).toBe(true);
  });

  it("ALLOWS git clone --depth 1 for Manus --github import", () => {
    expect(() => assertSafeCommand('git clone --depth 1 "https://github.com/x/y" "/tmp/x"')).not.toThrow();
  });

  it("ALLOWS powershell Expand-Archive for Manus --zip import", () => {
    const cmd = `powershell -NoProfile -Command "Expand-Archive -LiteralPath 'a.zip' -DestinationPath 'b' -Force"`;
    expect(() => assertSafeCommand(cmd)).not.toThrow();
  });

  it("BLOCKS curl", () => {
    expect(() => assertSafeCommand("curl https://evil.example")).toThrow(/Refusing/);
  });

  it("BLOCKS wget", () => {
    expect(() => assertSafeCommand("wget https://evil.example")).toThrow(/Refusing/);
  });

  it("BLOCKS Invoke-WebRequest", () => {
    expect(() => assertSafeCommand("Invoke-WebRequest https://evil.example")).toThrow(/Refusing/);
  });

  it("BLOCKS ssh", () => {
    expect(() => assertSafeCommand("ssh user@host")).toThrow(/Refusing/);
  });

  it("BLOCKS scp", () => {
    expect(() => assertSafeCommand("scp file user@host:")).toThrow(/Refusing/);
  });

  it("BLOCKS git push", () => {
    expect(() => assertSafeCommand("git push origin main")).toThrow(/Refusing/);
  });

  it("BLOCKS git remote add", () => {
    expect(() => assertSafeCommand("git remote add evil https://x")).toThrow(/Refusing/);
  });

  it("BLOCKS npm publish", () => {
    expect(() => assertSafeCommand("npm publish --access public")).toThrow(/Refusing/);
  });

  it("BLOCKS pnpm publish", () => {
    expect(() => assertSafeCommand("pnpm publish")).toThrow(/Refusing/);
  });

  it("BLOCKS base64 -d", () => {
    expect(() => assertSafeCommand("base64 -d secret.txt")).toThrow(/Refusing/);
  });

  it("BLOCKS rmdir / del / Remove-Item", () => {
    expect(() => assertSafeCommand("rmdir some/dir")).toThrow(/Refusing/);
    expect(() => assertSafeCommand("del file.txt")).toThrow(/Refusing/);
    expect(() => assertSafeCommand("Remove-Item -Recurse .")).toThrow(/Refusing/);
  });

  it("BLOCKS keytool and openssl req", () => {
    expect(() => assertSafeCommand("keytool -genkey")).toThrow(/Refusing/);
    expect(() => assertSafeCommand("openssl req -new")).toThrow(/Refusing/);
  });

  it("BLOCKS process-killers", () => {
    expect(() => assertSafeCommand("pkill node")).toThrow(/Refusing/);
    expect(() => assertSafeCommand("kill -9 1234")).toThrow(/Refusing/);
    expect(() => assertSafeCommand("taskkill /F /IM node.exe")).toThrow(/Refusing/);
    expect(() => assertSafeCommand("Stop-Process -Name node")).toThrow(/Refusing/);
  });
});
