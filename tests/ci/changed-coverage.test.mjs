import assert from "node:assert/strict";
import { test } from "node:test";
import {
  changedLines,
  checkChangedCoverage,
  parseCoverage,
} from "../../scripts/check-changed-coverage.mjs";

const file = "src/example.ts";
const coverage = (hits, path = file) =>
  parseCoverage(
    `SF:${path}\n${hits.map((hit, i) => `DA:${i + 1},${hit}`).join("\n")}\nend_of_record\n`,
  );
const additions = (numbers, path = file) => new Map([[path, new Set(numbers)]]);

test("finds added and modified lines, excluding deleted lines", () => {
  const diff = `diff --git a/src/example.ts b/src/example.ts
--- a/src/example.ts
+++ b/src/example.ts
@@ -2 +2 @@
-old
+replacement
@@ -4,0 +5,2 @@
+first
+second
@@ -8,2 +9,0 @@
-deleted
-deleted
`;
  assert.deepEqual([...changedLines(diff).get(file)], [2, 5, 6]);
});

for (const [hits, expected] of [
  [[1, 1, 1, 0, 0], false],
  [[1, 1, 1, 1, 0], true],
  [[1, 1, 1, 1, 1], true],
]) {
  test(`requires 80% of changed lines (${hits.filter(Boolean).length}/5), ignoring unchanged lines`, () => {
    const result = checkChangedCoverage(
      coverage([...hits, 0, 0]),
      additions([1, 2, 3, 4, 5]),
    );
    assert.equal(result.passed, expected);
  });
}

test("counts changed lines across app code and Edge Function handlers", () => {
  const handler = "supabase/functions/walking-route/handler.ts";
  const reports = new Map([
    ...coverage([0]),
    ...coverage([1, 1, 1], "src/screen.tsx"),
    ...coverage([1], handler),
  ]);
  const changes = new Map([
    ...additions([1]),
    ...additions([1, 2, 3], "src/screen.tsx"),
    ...additions([1], handler),
  ]);
  assert.deepEqual(checkChangedCoverage(reports, changes), {
    covered: 4,
    total: 5,
    passed: true,
  });
});

test("passes when changes contain no measured source lines", () => {
  const changes = new Map([
    ...additions([2]), // No coverage entry for this line, such as a blank line.
    ...additions([1], "docs/guide.md"),
    ...additions([1], "src/classes/types.ts"),
    ...additions([1], "src/env.d.ts"),
    ...additions([], "src/deleted.ts"),
  ]);
  assert.deepEqual(checkChangedCoverage(coverage([1]), changes), {
    covered: 0,
    total: 0,
    passed: true,
  });
});

test("handles renames and quoted paths without counting a pure rename as added code", () => {
  const oldPath = JSON.stringify('a/src/quote".ts');
  const newPath = JSON.stringify('b/src/quote".ts');
  const diff = `diff --git a/src/old.ts b/src/new.ts
similarity index 100%
rename from src/old.ts
rename to src/new.ts
diff --git ${oldPath} ${newPath}
--- ${oldPath}
+++ ${newPath}
@@ -1 +1 @@
+replacement
`;
  assert.deepEqual([...changedLines(diff)], [['src/quote".ts', new Set([1])]]);
});

test("rejects missing or malformed coverage instead of silently passing", () => {
  assert.throws(
    () => checkChangedCoverage(new Map(), additions([1])),
    /Missing coverage/,
  );
  assert.throws(
    () => parseCoverage(`SF:${file}\nDA:1,invalid\n`),
    /Invalid LCOV/,
  );
});

test("merges repeated line records without double-counting covered lines", () => {
  const merged = parseCoverage(
    `SF:${file}\nDA:1,0\nDA:2,0\nSF:${file}\nDA:1,2\n`,
  );
  assert.deepEqual(
    [...merged.get(file)],
    [
      [1, true],
      [2, false],
    ],
  );
});
