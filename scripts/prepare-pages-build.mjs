import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const webOut = resolve(root, "apps/web/out");
const buildDir = resolve(root, "build");

const domainArgIndex = process.argv.findIndex((arg) => arg === "--domain");
const domainFromArg =
  domainArgIndex >= 0 ? process.argv[domainArgIndex + 1] : undefined;
const domainFromEquals = process.argv
  .find((arg) => arg.startsWith("--domain="))
  ?.slice("--domain=".length);
const domain = (domainFromEquals || domainFromArg || process.env.CUSTOM_DOMAIN || "").trim();

if (!existsSync(webOut)) {
  throw new Error("Không thấy apps/web/out. Hãy chạy next build trước.");
}

if (existsSync(buildDir)) {
  rmSync(buildDir, { force: true, recursive: true });
}

mkdirSync(buildDir, { recursive: true });
cpSync(webOut, buildDir, { recursive: true });
writeFileSync(resolve(buildDir, ".nojekyll"), "", "utf8");

if (domain) {
  writeFileSync(resolve(buildDir, "CNAME"), `${domain}\n`, "utf8");
  console.log(`Created build/CNAME for ${domain}`);
} else {
  console.log("Skipped CNAME. Set CUSTOM_DOMAIN or pass -- --domain your-domain.com.");
}

console.log("Static site is ready in ./build");
