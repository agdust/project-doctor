import type { GlobalContext } from "../../types.js";

export type DocsContext = {
  readme: string | null;
  license: string | null;
  changelog: string | null;
};

export async function loadContext(global: GlobalContext): Promise<DocsContext> {
  const [readme, license, changelog] = await Promise.all([
    global.files.readText("README.md"),
    global.files.readText("LICENSE"),
    global.files.readText("CHANGELOG.md"),
  ]);

  return { readme, license, changelog };
}
