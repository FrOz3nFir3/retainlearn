// Every endpoint injected into the shared API slice has a name of its own. RTK Query keeps the first endpoint injected
// under a name and ignores later ones, so two features sharing a name break whichever loads second: on 2026-11-27 the
// paths' getHistory took the study set's history's place, and the classroom crashed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const src = new URL("..", import.meta.url).pathname;
const sources = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "node_modules" ? [] : sources(path);
    return /\.(ts|tsx|js|jsx)$/.test(entry.name) && !/\.test\./.test(entry.name) ? [path] : [];
  });

test("every endpoint in the API slice has a name of its own", () => {
  const seen = new Map<string, string>();
  const twice: string[] = [];
  for (const file of sources(src)) {
    for (const [, name] of readFileSync(file, "utf8").matchAll(/^\s+([A-Za-z]+): build\.(?:query|mutation|infiniteQuery)/gm)) {
      if (!name) continue;
      if (seen.has(name)) twice.push(`${name} (${seen.get(name)?.slice(src.length)} and ${file.slice(src.length)})`);
      else seen.set(name, file);
    }
  }
  assert.ok(seen.size > 20, "the endpoints were found");
  assert.deepEqual(twice, []);
});
