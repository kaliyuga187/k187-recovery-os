#!/usr/bin/env python3
"""Deploy the 123automateme-hub to the apex-prod VPS with the new
work-index section. Additive: rebuilds + recreates the k187-hub
container, leaves everything else untouched.
"""
import os
import sys
import tarfile
import tempfile
import time
import subprocess
from pathlib import Path

# Use paramiko from py-3.12
import subprocess
r = subprocess.run(["py", "-3.12", "-c", "import paramiko; print('ok', paramiko.__version__)"],
                   capture_output=True, text=True)
print("paramiko check:", r.stdout.strip(), r.stderr.strip())
if "ok" not in r.stdout:
    print("Installing paramiko...")
    subprocess.run(["py", "-3.12", "-m", "pip", "install", "paramiko", "--quiet"], check=True)

# Now actually import
result = subprocess.run(
    ["py", "-3.12", "-c", """
import paramiko, sys
sys.path.insert(0, '.')
"""],
    capture_output=True, text=True
)

# Use the py-3.12 binary for the rest
PY312 = "py -3.12"
print(f"\nUsing: {PY312}\n")

DEPLOY_SCRIPT = r'''
import os, sys, time, tarfile, tempfile
sys.path.insert(0, ".")
import paramiko

VPS_HOST = "139.180.174.4"
VPS_USER = "root"
VPS_PORT = 22
KEY_PATH = os.path.expanduser("~/.ssh/id_ed25519")
LOCAL_ROOT = r"C:\Users\nk187\123automateme-hub"
REMOTE_BUILD_DIR = "/tmp/123automateme-hub-build"
REMOTE_APP_DIR = "/opt/123automateme-hub"

# --- 1. SSH connect ---
print(f"[1] Connecting to {VPS_USER}@{VPS_HOST}:{VPS_PORT} ...")
key = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, pkey=key, timeout=30)
print("    OK")

sftp = client.open_sftp()

# --- 2. Prepare remote build dir ---
print(f"[2] Preparing {REMOTE_BUILD_DIR} ...")
client.exec_command(f"rm -rf {REMOTE_BUILD_DIR} && mkdir -p {REMOTE_BUILD_DIR}")
time.sleep(2)

# --- 3. Build a local tarball ---
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
        tar.add(entry.name, arcname=entry.name)
size = os.path.getsize(local_tar.name)
print(f"    {size/1024:.1f} KB tarball at {local_tar.name}")

# --- 4. Upload ---
print(f"[4] Uploading tarball ...")
remote_tar = f"{REMOTE_BUILD_DIR}/context.tar.gz"
sftp.put(local_tar.name, remote_tar)
os.unlink(local_tar.name)
print(f"    OK -> {remote_tar}")

# --- 5. Extract on the remote ---
print("[5] Extracting ...")
client.exec_command(f"cd {REMOTE_BUILD_DIR} && tar -xzf context.tar.gz && rm context.tar.gz")
time.sleep(3)

# --- 6. Verify the data file is there ---
print("[6] Verifying ...")
client.exec_command(f"ls {REMOTE_BUILD_DIR}/src/data/portfolio-export.json")
time.sleep(1)
stdin, stdout, stderr = client.exec_command(f"ls -la {REMOTE_BUILD_DIR}/src/data/portfolio-export.json")
print(f"    {stdout.read().decode().strip()}")

# --- 7. Build the Docker image ---
print("[7] Building Docker image (this can take 2-5 min) ...")
build_cmd = f"cd {REMOTE_BUILD_DIR} && docker build -t k187-hub:latest . 2>&1 | tail -20"
stdin, stdout, stderr = client.exec_command(build_cmd, timeout=600)
out = ""
for line in stdout:
    out = line.rstrip()
    print(f"    {out}")
err = stderr.read().decode()
if err:
    print(f"    ERR: {err[:500]}")
print(f"    build exit: {stdout.channel.recv_exit_status()}")

# --- 8. Recreate the container ---
print("[8] Recreating k187-hub container ...")
up_cmd = "cd /opt/k187-nexus-suite && docker compose up -d hub 2>&1 | tail -10"
stdin, stdout, stderr = client.exec_command(up_cmd, timeout=60)
out = ""
for line in stdout:
    out = line.rstrip()
    print(f"    {out}")
print(f"    up exit: {stdout.channel.recv_exit_status()}")

# --- 9. Health check ---
print("[9] Health check ...")
time.sleep(5)
check_cmd = "docker ps --filter name=k187-hub --format '{{.Names}}\\t{{.Status}}'"
stdin, stdout, stderr = client.exec_command(check_cmd)
print(f"    {stdout.read().decode().strip()}")

# --- 10. Verify the work-index section is in the served HTML ---
print("[10] Verifying work-index in served HTML ...")
verify_cmd = "curl -sS http://127.0.0.1:3738/ | grep -c 'id=\"work-index\"'"
stdin, stdout, stderr = client.exec_command(verify_cmd)
print(f"    id=\"work-index\" occurrences in served HTML: {stdout.read().decode().strip()}")

# --- 11. Public-domain check ---
print("[11] Public check (https://123automateme.com) ...")
pub_cmd = "curl -sS -o /dev/null -w 'HTTP %{http_code} | %{size_download}b\\n' --max-time 15 https://123automateme.com/"
stdin, stdout, stderr = client.exec_command(pub_cmd)
print(f"    {stdout.read().decode().strip()}")

# Cleanup
client.exec_command(f"rm -rf {REMOTE_BUILD_DIR}")
sftp.close()
client.close()
print("\nDone.")
'''

# Write the deploy script to a file so py-3.12 can run it
script_path = "C:/Users/nk187/k187-recovery-os/.operator/deploy-hub.py"
with open(script_path, "w") as f:
    f.write(DEPLOY_SCRIPT)

print(f"Wrote {script_path}")
print("Run: py -3.12", script_path)
