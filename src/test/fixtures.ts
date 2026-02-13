import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "fixtures");

export const fixtures = {
  healthy: join(fixturesDir, "healthy-project"),
  minimal: join(fixturesDir, "minimal-project"),
  broken: join(fixturesDir, "broken-project"),
  empty: join(fixturesDir, "empty-project"),
  shellOnly: join(fixturesDir, "shell-only-project"),
} as const;

export type FixtureName = keyof typeof fixtures;

export function getFixturePath(name: FixtureName): string {
  return fixtures[name];
}
