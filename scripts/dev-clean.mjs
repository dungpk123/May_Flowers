import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync, spawn } from "node:child_process";

const root = process.cwd();
const nextDir = resolve(root, "apps", "web", ".next");
const ports = [3000, 4000];

function runPowerShell(command) {
  try {
    return execFileSync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    );
  } catch {
    return "";
  }
}

function killPort(port) {
  const output = runPowerShell(
    `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`
  );

  const pids = output
    .split(/\r?\n/)
    .map((line) => Number(line.trim()))
    .filter((pid) => Number.isFinite(pid) && pid > 0);

  for (const pid of pids) {
    try {
      runPowerShell(`Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue`);
      console.log(`Stopped process ${pid} on port ${port}`);
    } catch {
      console.log(`Could not stop process ${pid} on port ${port}`);
    }
  }
}

for (const port of ports) {
  killPort(port);
}

rmSync(nextDir, { force: true, recursive: true });
console.log("Removed apps/web/.next");

const child = spawn("npm", ["run", "dev"], {
  cwd: root,
  shell: true,
  stdio: "inherit"
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
