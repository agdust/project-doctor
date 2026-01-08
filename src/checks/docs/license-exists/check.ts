import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../../../types.js";
import type { DocsContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "license-exists";

const MIT_LICENSE = `MIT License

Copyright (c) ${new Date().getFullYear()}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

export const check: Check<DocsContext> = {
  name,
  description: "Check if LICENSE file exists",
  tags: ["universal", "recommended", "effort:low"],
  run: async (_global, { license }) => {
    if (!license) return fail(name, "LICENSE file not found");
    return pass(name, "LICENSE file exists");
  },
  fix: {
    description: "Create MIT LICENSE file",
    run: async (global) => {
      const licensePath = join(global.projectPath, "LICENSE");
      await writeFile(licensePath, MIT_LICENSE, "utf-8");
      return { success: true, message: "Created MIT LICENSE" };
    },
  },
};
