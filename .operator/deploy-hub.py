#!/usr/bin/env python3
"""Deploy the 123automateme-hub to the apex-prod VPS with the new
work-index section. Additive: rebuilds + recreates the k187-hub
container, leaves everything else untouched.
"""
import os, sys, time, tarfile, tempfile
import paramiko

VPS_HOST = "139.180.174.4"
VPS_USER = "root"
VPS_PORT = 22
KEY_PATH = os.path.expanduser("~/.ssh/id_ed25519")
LOCAL_ROOT = r"C:\Users\nk187\123automateme-hub"
REMOTE_BUILD_DIR = "/tmp/123automateme-hub-build"
REMOTE_APP_DIR = "/opt/123automateme-hub"

print(f"[1] Connecting to {VPS_USER}@{VPS_HOST}:{VPS_PORT} ...")
key = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, pkey=key, timeout=30)
print("    OK")

sftp = client.open_sftp()

print(f"[2] Preparing {REMOTE_BUILD_DIR} ...")
client.exec_command(f"rm -rf {REMOTE_BUILD_DIR} && mkdir -p {REMOTE_BUILD_DIR}")
time.sleep(2)

print("[3] Building local tarball ...")
EXCLUDE_DIRS = {"node_modules", ".next", "dist", ".git", ".turbo"}
EXCLUDE_FILES = {".env", ".env.local", ".env.production"}
local_tar = tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False)
local_tar.close()
with tarfile.open(local_tar.name, "w:gz") as tar:
    for entry in os.scandir(LOCAL_ROOT):
        if entry.name in EXCLUDE_DIRS or entry.name in EXCLUDE_FILES:
            continue
        if entry.name.startswith(".") and entry.name not in (".dockerignore",):
            continue
        full = os.path.join(LOCAL_ROOT, entry.name)
        tar.add(full, arcname=entry.name)
size = os.path.getsize(local_tar.name)
print(f"    {size/1024:.1f} KB tarball at {local_tar.name}")

print(f"[4] Uploading tarball ...")
remote_tar = f"{REMOTE_BUILD_DIR}/context.tar.gz"
sftp.put(local_tar.name, remote_tar)
os.unlink(local_tar.name)
print(f"    OK -> {remote_tar}")

print("[5] Extracting ...")
client.exec_command(f"cd {REMOTE_BUILD_DIR} && tar -xzf context.tar.gz && rm context.tar.gz")
time.sleep(3)

print("[6] Verifying ...")
stdin, stdout, stderr = client.exec_command(f"ls -la {REMOTE_BUILD_DIR}/src/data/portfolio-export.json 2>&1")
print(f"    {stdout.read().decode().strip()}")

print("[7] Building Docker image (2-5 min) ...")
build_cmd = f"cd {REMOTE_BUILD_DIR} && docker build -t k187-hub:latest . 2>&1 | tail -30"
stdin, stdout, stderr = client.exec_command(build_cmd, timeout=600)
exit_code = None
for line in stdout:
    print(f"    {line.rstrip()}")
    if exit_code is None and line.rstrip().startswith(("DONE", "Successfully", "ERROR", "error")):
        pass
exit_code = stdout.channel.recv_exit_status()
print(f"    build exit: {exit_code}")

print("[8] Recreating k187-hub container ...")
up_cmd = "cd /opt/k187-nexus-suite && docker compose up -d hub 2>&1 | tail -10"
stdin, stdout, stderr = client.exec_command(up_cmd, timeout=60)
for line in stdout:
    print(f"    {line.rstrip()}")
print(f"    up exit: {stdout.channel.recv_exit_status()}")

print("[9] Container status ...")
time.sleep(3)
check_cmd = "docker ps --filter name=k187-hub --format '{{.Names}}\\t{{.Status}}\\t{{.Ports}}'"
stdin, stdout, stderr = client.exec_command(check_cmd)
print(f"    {stdout.read().decode().strip()}")

print("[10] Local-port health check ...")
verify_cmd = "curl -sS -o /dev/null -w 'HTTP %{http_code} | %{size_download}b\\n' --max-time 15 http://127.0.0.1:3738/"
stdin, stdout, stderr = client.exec_command(verify_cmd)
print(f"    {stdout.read().decode().strip()}")

print("[11] Verify work-index in served HTML ...")
verify2 = "curl -sS http://127.0.0.1:3738/ | grep -c 'id=\"work-index\"'"
stdin, stdout, stderr = client.exec_command(verify2)
print(f"    work-index count: {stdout.read().decode().strip()}")

print("[12] Public check https://123automateme.com ...")
pub = "curl -sS -o /dev/null -w 'HTTP %{http_code} | %{size_download}b\\n' --max-time 20 https://123automateme.com/"
stdin, stdout, stderr = client.exec_command(pub)
print(f"    {stdout.read().decode().strip()}")

# Cleanup
client.exec_command(f"rm -rf {REMOTE_BUILD_DIR}")
sftp.close()
client.close()
print("\nDone.")
