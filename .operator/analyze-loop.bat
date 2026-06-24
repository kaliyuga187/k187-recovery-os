@echo off
cd /d C:\Users\nk187\k187-recovery-os\apps\scanner
set LOG=C:\Users\nk187\k187-recovery-os\.operator\analyze-loop.log
echo === Starting analyze loop at %date% %time% === > "%LOG%"
for /f "delims=" %%s in (C:\Users\nk187\k187-recovery-os\.operator\analyze-slugs.txt) do (
  echo === Analyzing %%s === >> "%LOG%"
  call node --env-file=C:\Users\nk187\k187-recovery-os\.env --import "file:///C:/Users/nk187/k187-recovery-os/node_modules/.pnpm/tsx@4.19.2/node_modules/tsx/dist/esm/index.mjs" ./src/cli.ts operator analyze --project "%%s" >> "%LOG%" 2>&1
  echo === Done %%s (exit %errorlevel%) === >> "%LOG%"
)
echo === Loop complete at %date% %time% === >> "%LOG%"
