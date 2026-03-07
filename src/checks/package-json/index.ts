import { check as exists } from "./exists/check.js";
import { check as valid } from "./valid/check.js";
import { check as hasName } from "./has-name/check.js";
import { check as hasVersion } from "./has-version/check.js";
import { check as hasDescription } from "./has-description/check.js";
import { check as hasLicense } from "./has-license/check.js";
import { check as hasEngines } from "./has-engines/check.js";
import { check as typeModule } from "./type-module/check.js";
import { check as hasMainOrExports } from "./has-main-or-exports/check.js";
import { check as scriptsBuild } from "./scripts-build/check.js";
import { check as scriptsDev } from "./scripts-dev/check.js";
import { check as scriptsTest } from "./scripts-test/check.js";
import { check as scriptsLint } from "./scripts-lint/check.js";
import { check as scriptsFormat } from "./scripts-format/check.js";
import { check as hasPackageManager } from "./has-package-manager/check.js";
import { check as devDepsInDependencies } from "./dev-deps-in-dependencies/check.js";

export { loadContext } from "./context.js";

export const checks = [
  exists,
  valid,
  hasName,
  hasVersion,
  hasDescription,
  hasLicense,
  hasEngines,
  hasPackageManager,
  typeModule,
  hasMainOrExports,
  scriptsBuild,
  scriptsDev,
  scriptsTest,
  scriptsLint,
  scriptsFormat,
  devDepsInDependencies,
];
