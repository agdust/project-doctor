import type { GlobalContext } from "../../types.ts";

export type DocsContext = {
  readme: string | null;
  license: string | null;
  changelog: string | null;
  contributing: string | null;
};

export async function loadContext(global: GlobalContext): Promise<DocsContext> {
  const [readme, license, changelog, contributing] = await Promise.all([
    global.files.readText("README.md"),
    global.files.readText("LICENSE"),
    global.files.readText("CHANGELOG.md"),
    global.files.readText("CONTRIBUTING.md"),
  ]);

  return { readme, license, changelog, contributing };
}
