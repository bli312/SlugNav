import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const requiredCoverage = 80;

export function parseCoverage(report) {
  const files = new Map();
  let lines;
  for (const record of report.split(/\r?\n/)) {
    if (record.startsWith("SF:")) {
      const file = record.slice(3);
      if (!files.has(file)) files.set(file, new Map());
      lines = files.get(file);
    } else if (record.startsWith("DA:")) {
      const [line, hits] = record.slice(3).split(",").map(Number);
      if (
        !lines ||
        !Number.isInteger(line) ||
        line < 1 ||
        !Number.isFinite(hits) ||
        hits < 0
      ) {
        throw new Error("Invalid LCOV line record.");
      }
      lines.set(line, lines.get(line) || hits > 0);
    }
  }
  return files;
}

export function changedLines(diff) {
  const files = new Map();
  let file;
  for (const line of diff.split("\n")) {
    if (line.startsWith("diff --git ")) file = undefined;
    if (!file && line.startsWith("+++ ")) {
      const path = line.slice(4);
      file = (path.startsWith('"') ? JSON.parse(path) : path).replace(
        /^b\//,
        "",
      );
      files.set(file, new Set());
    }
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (!hunk || !file) continue;
    const start = Number(hunk[1]);
    const count = Number(hunk[2] ?? 1);
    for (let number = start; number < start + count; number++)
      files.get(file).add(number);
  }
  return files;
}

export function checkChangedCoverage(coverage, changes) {
  const changed = { covered: 0, total: 0 };
  for (const [file, numbers] of changes) {
    if (
      !/^(src\/.*\.tsx?|supabase\/functions\/.*\/handler\.ts)$/.test(file) ||
      file.endsWith(".d.ts") ||
      file.endsWith("/types.ts") ||
      /^src\/(components\/classes\/pisa|components\/places\/data|hooks|lib|providers|util)\//.test(
        file,
      )
    ) {
      continue;
    }
    if (!numbers.size) continue;
    const lines = coverage.get(file);
    if (!lines)
      throw new Error(`Missing coverage for changed source file: ${file}`);
    for (const number of numbers) {
      if (!lines.has(number)) continue;
      changed.total++;
      if (lines.get(number)) changed.covered++;
    }
  }
  return {
    ...changed,
    passed: changed.covered * 100 >= requiredCoverage * changed.total,
  };
}

function readCoverage() {
  const reports = ["node", "components"].map((suite) => {
    const report = readFileSync(`coverage/${suite}/lcov.info`, "utf8");
    if (!report.includes("SF:"))
      throw new Error(`Empty ${suite} coverage report.`);
    return report;
  });
  return parseCoverage(reports.join("\n"));
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "")) {
  const baseRef = process.argv[2];
  if (!baseRef) throw new Error("Provide the PR's base commit.");
  const diff = execFileSync(
    "git",
    [
      "-c",
      "core.quotePath=false",
      "diff",
      "--no-ext-diff",
      "--no-textconv",
      "--no-color",
      "--find-renames",
      "--unified=0",
      baseRef,
      "HEAD",
      "--",
      "src",
      "supabase/functions",
    ],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  );
  const result = checkChangedCoverage(readCoverage(), changedLines(diff));
  const message = result.total
    ? `Changed-line coverage: ${((100 * result.covered) / result.total).toFixed(2)}% (${result.covered}/${result.total} lines); required: ${requiredCoverage}% — ${result.passed ? "PASS" : "FAIL"}.\n`
    : "No measured source lines added or modified.\n";
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, message);
  if (!result.passed) process.exitCode = 1;
}
