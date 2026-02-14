import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../../../types.js";
import type { DocsContext } from "../context.js";
import { pass, fail } from "../../helpers.js";
import { openBrowser } from "../../../utils/open-browser.js";

const name = "license-exists";

const year = new Date().getFullYear();

// Source: https://opensource.org/licenses/MIT (SPDX: MIT)
const MIT_LICENSE = `MIT License

Copyright (c) ${year}

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

// Source: https://www.gnu.org/licenses/gpl-3.0.txt (SPDX: GPL-3.0-only)
// Note: Preamble only - full text is ~35KB, linked below
const GPL3_LICENSE = `GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
Everyone is permitted to copy and distribute verbatim copies
of this license document, but changing it is not allowed.

                            Preamble

The GNU General Public License is a free, copyleft license for
software and other kinds of works.

The licenses for most software and other practical works are designed
to take away your freedom to share and change the works.  By contrast,
the GNU General Public License is intended to guarantee your freedom to
share and change all versions of a program--to make sure it remains free
software for all its users.  We, the Free Software Foundation, use the
GNU General Public License for most of our software; it applies also to
any other work released this way by its authors.  You can apply it to
your programs, too.

For the complete license text, see <https://www.gnu.org/licenses/gpl-3.0.txt>
`;

// Source: https://creativecommons.org/publicdomain/zero/1.0/ (SPDX: CC0-1.0)
// Note: Human-readable deed - full legal code linked below
const CC0_LICENSE = `CC0 1.0 Universal (CC0 1.0) Public Domain Dedication

The person who associated a work with this deed has dedicated the work to the
public domain by waiving all of his or her rights to the work worldwide under
copyright law, including all related and neighboring rights, to the extent
allowed by law.

You can copy, modify, distribute and perform the work, even for commercial
purposes, all without asking permission.

For more information, see <https://creativecommons.org/publicdomain/zero/1.0/>
`;

// Generic proprietary license template
const PROPRIETARY_LICENSE = `PROPRIETARY LICENSE

Copyright (c) ${year}

All rights reserved.

This software and associated documentation files (the "Software") are the
exclusive property of the copyright holder. No part of this Software may be
reproduced, distributed, or transmitted in any form or by any means, including
photocopying, recording, or other electronic or mechanical methods, without
the prior written permission of the copyright holder.

For licensing inquiries, contact the copyright holder.
`;

export const check: Check<DocsContext> = {
  name,
  description: "Check if LICENSE file exists",
  tags: ["universal", "required", "effort:low"],
  run: async (_global, { license }) => {
    if (!license) return fail(name, "LICENSE file not found");
    return pass(name, "LICENSE file exists");
  },
  fix: {
    description: "Create LICENSE file",
    options: [
      {
        id: "mit",
        label: "MIT License",
        description: "Permissive license, allows forks to be closed source",
        run: async (global) => {
          const licensePath = join(global.projectPath, "LICENSE");
          await writeFile(licensePath, MIT_LICENSE, "utf-8");
          return { success: true, message: "Created MIT LICENSE" };
        },
      },
      {
        id: "gpl3",
        label: "GPL-3.0 License",
        description: "Copyleft license, requires derivative works to be open source",
        run: async (global) => {
          const licensePath = join(global.projectPath, "LICENSE");
          await writeFile(licensePath, GPL3_LICENSE, "utf-8");
          return { success: true, message: "Created GPL-3.0 LICENSE" };
        },
      },
      {
        id: "cc0",
        label: "CC0 (Public Domain)",
        description: "Dedicate to public domain, no restrictions",
        run: async (global) => {
          const licensePath = join(global.projectPath, "LICENSE");
          await writeFile(licensePath, CC0_LICENSE, "utf-8");
          return { success: true, message: "Created CC0 LICENSE" };
        },
      },
      {
        id: "proprietary",
        label: "Proprietary",
        description: "All rights reserved, for internal/private projects",
        run: async (global) => {
          const licensePath = join(global.projectPath, "LICENSE");
          await writeFile(licensePath, PROPRIETARY_LICENSE, "utf-8");
          return { success: true, message: "Created PROPRIETARY LICENSE" };
        },
      },
      {
        id: "browse",
        label: "Browse licenses...",
        description: "Open choosealicense.com to compare options",
        run: async () => {
          await openBrowser("https://choosealicense.com/");
          return { success: false, message: "Opened browser - choose a license and add it manually" };
        },
      },
    ],
  },
};
