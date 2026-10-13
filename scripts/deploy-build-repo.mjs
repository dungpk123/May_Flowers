import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const buildDir = resolve(root, "build");
const repoUrl = (process.argv[2] || process.env.BUILD_REPO_URL || "").trim();

if (!repoUrl) {
  throw new Error(
    "Thiếu repo build. Chạy: npm run deploy:build-repo -- https://github.com/user/repo-build.git"
  );
}

if (!existsSync(buildDir)) {
  throw new Error("Chưa có thư mục build. Hãy chạy npm run build trước.");
}

const gitDir = resolve(buildDir, ".git");
if (existsSync(gitDir)) {
  rmSync(gitDir, { force: true, recursive: true });
}

const run = (command, args) => {
  execFileSync(command, args, {
    cwd: buildDir,
    stdio: "inherit"
  });
};

run("git", ["init"]);
run("git", ["branch", "-M", "main"]);
run("git", ["add", "-A"]);
run("git", ["commit", "-m", "Deploy static build"]);
run("git", ["remote", "add", "origin", repoUrl]);
run("git", ["push", "-f", "origin", "main"]);
