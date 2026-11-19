// Repository structure check: no dependencies, no Firebase/Vercel credentials required.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const keepDirs = new Set([".github", "api", "docs", "public", "scripts", "security", "src", "tests"]);
const keepFiles = new Set([
  ".gitignore", "README.md", "eslint.config.js", "index.html",
  "package.json", "package-lock.json", "vercel.json", "vite.config.js",
]);
const ignoredLocal = new Set([".git", ".vercel", "node_modules", "dist", "coverage"]);
const required = [
  "index.html", "package.json", "vite.config.js", "vercel.json",
  "src/App.jsx", "src/blackbox/backend.js", "src/utils/progressScope.js",
  "api/admin/summary.mjs", "security/firestore.current.rules",
  "docs/README.md", "docs/repository-map.md", "tests/routes.test.mjs",
];
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const next = join(dir, entry.name);
  return entry.isDirectory() ? walk(next) : entry.isFile() ? [next] : [];
});
const file = path => join(root, path);
const short = path => relative(root, path).split(sep).join("/");

for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (ignoredLocal.has(entry.name)) continue;
  if (entry.isDirectory() ? !keepDirs.has(entry.name) : !keepFiles.has(entry.name))
    failures.push("Unexpected repository root entry: " + entry.name);
}
for (const name of required) if (!existsSync(file(name)))
  failures.push("Missing protected application/build entry: " + name);
for (const leftover of ["src/assets/react.svg", "src/assets/vite.svg"])
  if (existsSync(file(leftover))) failures.push("Unused scaffold asset still present: " + leftover);

// Check local links in all Markdown docs, not just README.
const docs = [file("README.md"), ...walk(file("docs")).filter(path => path.endsWith(".md"))];
let checked = 0;
for (const markdown of docs) {
  const source = readFileSync(markdown, "utf8");
  for (const match of source.matchAll(/\]\(([^)]+)\)/g)) {
    let target = match[1].trim().replace(/^</, "").replace(/>$/, "").split(/\s+["']/)[0];
    if (!target || /^(https?:|mailto:|data:|#|\/)/i.test(target)) continue;
    target = decodeURIComponent(target.split("#")[0].split("?")[0]);
    if (!target) continue;
    const absolute = resolve(dirname(markdown), target);
    if (!absolute.startsWith(root + sep) && absolute !== root)
      failures.push("Link escapes repository: " + short(markdown) + " -> " + target);
    else if (!existsSync(absolute))
      failures.push("Broken documentation link: " + short(markdown) + " -> " + target);
    checked++;
  }
}

if (failures.length) {
  for (const failure of failures) console.error("STRUCTURE:", failure);
  process.exitCode = 1;
} else {
  console.log("Repository structure OK (CyberTrace); " + docs.length + " Markdown files, " + checked + " local links checked.");
}
