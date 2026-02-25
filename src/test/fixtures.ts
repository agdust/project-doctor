import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "fixtures");

export const fixtures = {
  healthy: path.join(fixturesDir, "healthy-project"),
  minimal: path.join(fixturesDir, "minimal-project"),
  broken: path.join(fixturesDir, "broken-project"),
  empty: path.join(fixturesDir, "empty-project"),
  shellOnly: path.join(fixturesDir, "shell-only-project"),
  fixable: path.join(fixturesDir, "fixable-project"),
} as const;

export type FixtureName = keyof typeof fixtures;

export function getFixturePath(name: FixtureName): string {
  return fixtures[name];
}
